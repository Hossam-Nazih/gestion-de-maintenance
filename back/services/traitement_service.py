from extensions import db
from models.traitement import Traitement
from models.intervention import Intervention

class TraitementService:

    @staticmethod
    def traiter_intervention(intervention_id, technicien_id, duree_fixation,
                             heures_arret_machine, description_reparation,
                             pieces_changees, type_fixation, transfert_specialiste,
                             statut_final):

        traitement = Traitement(
            intervention_id=intervention_id,
            technicien_id=technicien_id,
            duree_fixation=duree_fixation,
            heures_arret_machine=heures_arret_machine,
            description_reparation=description_reparation,
            pieces_changees=pieces_changees,
            type_fixation=type_fixation,
            transfert_specialiste=transfert_specialiste,
            statut_final=statut_final
        )

        db.session.add(traitement)

        # Mise à jour statut intervention
        intervention = Intervention.query.get(intervention_id)
        if intervention:
            intervention.statut = 'terminee' if statut_final == 'terminee' else 'annulee'

        db.session.commit()
        return traitement
