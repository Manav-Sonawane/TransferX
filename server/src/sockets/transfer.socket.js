const Session = require('../models/Session');

module.exports = (io) => {
    // We can use a namespace like /p2p if we want, but for now we'll just use the default namespace.
    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        // Create a P2P Session
        socket.on('create-session', async ({ name, userId }, callback) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const generateCode = () => {
                let code = '';
                for (let i = 0; i < 5; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return code;
            };

            // sessionCode is unique-indexed; a random 5-char code collides
            // rarely but not never, so retry on a duplicate key error instead
            // of failing the whole request (share.service.js already does the
            // equivalent check-and-retry for share codes).
            const MAX_ATTEMPTS = 5;
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                const sessionCode = generateCode();
                try {
                    const session = await Session.create({
                        sessionCode,
                        hostId: userId || null,
                        participants: [{ socketId: socket.id, name, userId: userId || null }],
                        status: 'waiting',
                    });

                    socket.join(sessionCode);
                    socket.sessionCode = sessionCode;
                    socket.participantName = name;

                    console.log(`[Socket] ${name} (${socket.id}) created session ${sessionCode}`);
                    return callback({ success: true, session });
                } catch (error) {
                    if (error.code === 11000 && attempt < MAX_ATTEMPTS) {
                        continue; // sessionCode collision — try another code
                    }
                    console.error('[Socket] Create session error:', error);
                    return callback({ error: 'Internal server error' });
                }
            }
        });

        // Join a P2P Session
        socket.on('join-session', async ({ sessionCode, name, userId }, callback) => {
            try {
                const participant = { socketId: socket.id, name, userId: userId || null };

                // Atomically add the participant only if the session is open, not
                // closed, and still has a free slot — a plain read-then-write here
                // (find, check length, push, save) is a TOCTOU race: two joins
                // arriving close together can both pass the length check before
                // either save() commits, landing 3 participants in a 2-party session.
                const session = await Session.findOneAndUpdate(
                    {
                        sessionCode,
                        status: { $ne: 'closed' },
                        $expr: { $lt: [{ $size: '$participants' }, 2] },
                    },
                    { $push: { participants: participant } },
                    { new: true }
                );

                if (!session) {
                    // Distinguish "doesn't exist / closed" from "full" for a useful error.
                    const existing = await Session.findOne({ sessionCode });
                    if (!existing || existing.status === 'closed') {
                        return callback({ error: 'Session not found or already closed' });
                    }
                    return callback({ error: 'Session is full' });
                }

                if (session.participants.length === 2 && session.status !== 'active') {
                    session.status = 'active';
                    await session.save();
                }

                // Join the socket room
                socket.join(sessionCode);
                
                // Attach session info to the socket for easy cleanup on disconnect
                socket.sessionCode = sessionCode;
                socket.participantName = name;

                console.log(`[Socket] ${name} (${socket.id}) joined session ${sessionCode}`);

                // Notify others in the room
                socket.to(sessionCode).emit('peer-joined', participant);

                // Acknowledge successful join, send back the current session state
                callback({ success: true, session });
            } catch (error) {
                console.error('[Socket] Join session error:', error);
                callback({ error: 'Internal server error' });
            }
        });

        // WebRTC Signaling: Forwarding messages to the specific peer.
        //
        // Both the sender and the target must currently be members of the same
        // session room. Without this check, any connected socket could address
        // signaling traffic (including SDP offers) at any other connected socket
        // id on the server, whether or not they share a session.
        const isValidPeer = (sessionCode, targetSocketId) => {
            if (!sessionCode || socket.sessionCode !== sessionCode) return false;
            const room = io.sockets.adapter.rooms.get(sessionCode);
            return !!room && room.has(targetSocketId);
        };

        socket.on('webrtc-offer', ({ targetSocketId, offer, sessionCode }) => {
            if (!isValidPeer(sessionCode, targetSocketId)) {
                console.warn(`[Socket] Rejected offer from ${socket.id} to ${targetSocketId}: not a shared session`);
                return;
            }
            console.log(`[Socket] Forwarding offer from ${socket.id} to ${targetSocketId}`);
            socket.to(targetSocketId).emit('webrtc-offer', {
                senderSocketId: socket.id,
                offer
            });
        });

        socket.on('webrtc-answer', ({ targetSocketId, answer, sessionCode }) => {
            if (!isValidPeer(sessionCode, targetSocketId)) {
                console.warn(`[Socket] Rejected answer from ${socket.id} to ${targetSocketId}: not a shared session`);
                return;
            }
            console.log(`[Socket] Forwarding answer from ${socket.id} to ${targetSocketId}`);
            socket.to(targetSocketId).emit('webrtc-answer', {
                senderSocketId: socket.id,
                answer
            });
        });

        socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate, sessionCode }) => {
            if (!isValidPeer(sessionCode, targetSocketId)) return;
            // ICE candidates can be noisy, maybe don't log every single one
            socket.to(targetSocketId).emit('webrtc-ice-candidate', {
                senderSocketId: socket.id,
                candidate
            });
        });

        // Handle explicit leave or disconnect
        const handleLeave = async () => {
            const { sessionCode, id } = socket;
            if (!sessionCode) return;

            try {
                const session = await Session.findOne({ sessionCode });
                if (session) {
                    // Remove participant
                    session.participants = session.participants.filter(p => p.socketId !== id);
                    
                    if (session.participants.length === 0) {
                        session.status = 'closed';
                    } else {
                        session.status = 'waiting';
                        // Notify remaining participants
                        socket.to(sessionCode).emit('peer-left', { socketId: id });
                    }
                    
                    await session.save();
                }
            } catch (error) {
                console.error('[Socket] Disconnect error:', error);
            }
        };

        socket.on('leave-session', async () => {
            console.log(`[Socket] User ${socket.id} explicitly left session ${socket.sessionCode}`);
            await handleLeave();
            if (socket.sessionCode) {
                socket.leave(socket.sessionCode);
                socket.sessionCode = null;
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            handleLeave();
        });
    });
};
