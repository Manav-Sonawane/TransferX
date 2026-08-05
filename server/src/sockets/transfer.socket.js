const Session = require('../models/Session');

module.exports = (io) => {
    // We can use a namespace like /p2p if we want, but for now we'll just use the default namespace.
    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        // Create a P2P Session
        socket.on('create-session', async ({ name, userId }, callback) => {
            try {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                let sessionCode = '';
                for (let i = 0; i < 5; i++) {
                    sessionCode += chars.charAt(Math.floor(Math.random() * chars.length));
                }

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
                callback({ success: true, session });
            } catch (error) {
                console.error('[Socket] Create session error:', error);
                callback({ error: 'Internal server error' });
            }
        });

        // Join a P2P Session
        socket.on('join-session', async ({ sessionCode, name, userId }, callback) => {
            try {
                // Find active session
                const session = await Session.findOne({ sessionCode, status: { $ne: 'closed' } });
                
                if (!session) {
                    return callback({ error: 'Session not found or already closed' });
                }

                // A session can typically only have 2 participants for a direct P2P transfer MVP
                if (session.participants.length >= 2) {
                    return callback({ error: 'Session is full' });
                }

                // Add participant to DB
                const participant = { socketId: socket.id, name, userId: userId || null };
                session.participants.push(participant);
                
                if (session.participants.length === 2) {
                    session.status = 'active';
                }
                await session.save();

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

        // WebRTC Signaling: Forwarding messages to the specific peer
        socket.on('webrtc-offer', ({ targetSocketId, offer, sessionCode }) => {
            console.log(`[Socket] Forwarding offer from ${socket.id} to ${targetSocketId}`);
            socket.to(targetSocketId).emit('webrtc-offer', {
                senderSocketId: socket.id,
                offer
            });
        });

        socket.on('webrtc-answer', ({ targetSocketId, answer, sessionCode }) => {
            console.log(`[Socket] Forwarding answer from ${socket.id} to ${targetSocketId}`);
            socket.to(targetSocketId).emit('webrtc-answer', {
                senderSocketId: socket.id,
                answer
            });
        });

        socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate, sessionCode }) => {
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
