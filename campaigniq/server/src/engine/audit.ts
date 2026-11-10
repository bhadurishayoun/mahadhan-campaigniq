import { diffDays } from './dates';

// 5.12 Audit flags on field reports. All thresholds come from config.

export interface AuditConfig {
  min_attendance_ratio: number; // 0.5 of r
  max_gps_km: number; // 10
  max_cost_ratio: number; // 1.2 of c
  max_report_delay_days: number; // 3
}

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  min_attendance_ratio: 0.5,
  max_gps_km: 10,
  max_cost_ratio: 1.2,
  max_report_delay_days: 3,
};

export interface EventReport {
  attendance: number | null;
  r: number;
  c: number;
  actual_cost: number | null;
  gps_lat: number | null;
  gps_lng: number | null;
  photo_hash: string | null;
  actual_date: string | null;
  submitted_date: string | null;
}

export interface AuditFlagDraft {
  flag_type: 'low_attendance' | 'gps_missing' | 'gps_far' | 'duplicate_photo' | 'cost_overrun' | 'late_report';
  detail: string;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function auditEvent(
  e: EventReport,
  muCentroid: { lat: number; lng: number } | null,
  photoHashSeenElsewhere: boolean,
  cfg: Partial<AuditConfig> = {},
): AuditFlagDraft[] {
  const c = { ...DEFAULT_AUDIT_CONFIG, ...cfg };
  const flags: AuditFlagDraft[] = [];

  if (e.attendance !== null && e.attendance < c.min_attendance_ratio * e.r) {
    flags.push({
      flag_type: 'low_attendance',
      detail: `Attendance ${e.attendance} is below ${(c.min_attendance_ratio * 100).toFixed(0)}% of the expected ${e.r}`,
    });
  }

  if (e.gps_lat === null || e.gps_lng === null) {
    flags.push({ flag_type: 'gps_missing', detail: 'GPS location missing' });
  } else if (muCentroid) {
    const km = haversineKm(e.gps_lat, e.gps_lng, muCentroid.lat, muCentroid.lng);
    if (km > c.max_gps_km) {
      flags.push({
        flag_type: 'gps_far',
        detail: `Report location is ${km.toFixed(1)} km from the MU centre (limit ${c.max_gps_km} km)`,
      });
    }
  }

  if (e.photo_hash && photoHashSeenElsewhere) {
    flags.push({ flag_type: 'duplicate_photo', detail: 'This photo was already used on another event' });
  }

  if (e.actual_cost !== null && e.actual_cost > c.max_cost_ratio * e.c) {
    flags.push({
      flag_type: 'cost_overrun',
      detail: `Cost ₹${e.actual_cost} is above ${(c.max_cost_ratio * 100).toFixed(0)}% of the unit cost ₹${e.c}`,
    });
  }

  if (e.actual_date && e.submitted_date && diffDays(e.submitted_date, e.actual_date) > c.max_report_delay_days) {
    flags.push({
      flag_type: 'late_report',
      detail: `Reported ${diffDays(e.submitted_date, e.actual_date)} days after the event (limit ${c.max_report_delay_days})`,
    });
  }
  return flags;
}
