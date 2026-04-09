/**
 * Physical constants used in HVAC load calculations.
 * All values are in IP (inch-pound) units consistent with Manual J / ASHRAE.
 */

/** Sensible heat of airflow: 0.075 lb/ft³ × 0.24 BTU/lb·°F × 60 min/hr = 1.08 BTU/(hr·CFM·°F) */
export const AIR_SENSIBLE_CONSTANT = 1.08;

/** Latent heat of airflow: 0.68 BTU/(hr·CFM·grain of moisture) */
export const AIR_LATENT_CONSTANT = 0.68;

/** Convert watts to BTU/hr */
export const WATT_TO_BTUH = 3.412;

/** Sensible heat output per occupant at rest / light activity (BTU/hr) */
export const OCCUPANT_SENSIBLE = 230;

/** Latent heat output per occupant at rest / light activity (BTU/hr) */
export const OCCUPANT_LATENT = 200;

/** Default indoor design temperature for heating (°F) */
export const DEFAULT_INDOOR_WINTER = 70;

/** Default indoor design temperature for cooling (°F) */
export const DEFAULT_INDOOR_SUMMER = 75;

/** Nominal door U-value when doors are treated as a separate component */
export const DEFAULT_DOOR_U = 0.4;

/** Default door area if not specified (ft²) - typical 36"×80" main + secondary doors */
export const DEFAULT_DOOR_AREA = 40;

/** BTU/hr per ton of cooling */
export const BTUH_PER_TON = 12000;
