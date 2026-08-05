import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, bg }) => {
  return (
    <div className={`card-hover p-6 border ${bg} flex flex-col justify-between`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon size={22} className={color} />
        </div>
      </div>
      <div>
        <h3 className="text-surface-400 text-sm font-medium mb-1">{title}</h3>
        <p className="font-heading font-bold text-3xl text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
