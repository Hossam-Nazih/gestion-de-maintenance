def detect_type_probleme(description):
    desc = description.lower()
    if 'huile' in desc or 'pression' in desc:
        return 'hydraulique'
    if 'moteur' in desc or 'bruit' in desc:
        return 'mecanique'
    if 'câble' in desc or 'court-circuit' in desc:
        return 'electrique'
    return 'mecanique'  # default fallback
