from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.intervention import Intervention
from models.traitement import Traitement

technicien_bp = Blueprint('technicien', __name__)

@technicien_bp.route('/interventions', methods=['GET'])
@jwt_required()
def get_interventions():
    interventions = Intervention.query.all()
    result = []
    for i in interventions:
        result.append({
            'id': i.id,
            'equipement_id': i.equipement_id,
            'type_arret': i.type_arret,
            'description': i.description,
            'photo_path': i.photo_path,
            'type_probleme': i.type_probleme,
            'statut': i.statut,
            'created_at': i.created_at.isoformat()
        })
    return jsonify(result), 200

@technicien_bp.route('/interventions/<int:intervention_id>/traiter', methods=['POST'])
@jwt_required()
def traiter_intervention(intervention_id):
    data = request.get_json()
    technicien_id = get_jwt_identity()

    traitement = Traitement(
        intervention_id=intervention_id,
        technicien_id=technicien_id,
        duree_fixation=data.get('duree_fixation'),
        heures_arret_machine=data.get('heures_arret_machine'),
        description_reparation=data.get('description_reparation'),
        pieces_changees=data.get('pieces_changees'),
        type_fixation=data.get('type_fixation'),
        transfert_specialiste=data.get('transfert_specialiste', False),
        statut_final=data.get('statut_final')
    )
    db.session.add(traitement)

    # Mise à jour statut intervention
    intervention = Intervention.query.get(intervention_id)
    if intervention:
        intervention.statut = 'terminee' if traitement.statut_final == 'terminee' else 'annulee'
    db.session.commit()

    return jsonify({'message': 'Intervention traitée'}), 200
