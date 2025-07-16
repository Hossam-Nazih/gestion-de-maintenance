from extensions import db

class Traitement(db.Model):
    __tablename__ = 'traitements'

    id = db.Column(db.Integer, primary_key=True)
    intervention_id = db.Column(db.Integer, db.ForeignKey('interventions.id'), nullable=False)
    technicien_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    duree_fixation = db.Column(db.Float)
    heures_arret_machine = db.Column(db.Float)
    description_reparation = db.Column(db.Text)
    pieces_changees = db.Column(db.Text)
    type_fixation = db.Column(db.String(100))
    transfert_specialiste = db.Column(db.Boolean, default=False)
    statut_final = db.Column(db.Enum('terminee', 'annulee'), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
