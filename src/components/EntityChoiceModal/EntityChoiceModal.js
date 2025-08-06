import React from 'react';
import './EntityChoiceModal.css';

const EntityChoiceModal = ({ buildings, onSelect, onClose }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="choice-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Select Action</h3>
                <div className="choice-list">
                    {buildings.map(building => (
                        <button key={building.id} onClick={() => onSelect(building)}>
                            {building.name} Actions
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EntityChoiceModal;