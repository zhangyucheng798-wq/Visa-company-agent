import { findCaseById, findMaterialSlotById } from '../domain/entity-store.js'

export function validateUploadSlotScope({ tenantId, caseId, materialSlotId }) {
  const visaCase = findCaseById(caseId, tenantId)
  if (!visaCase) {
    return {
      ok: false,
      error: {
        status: 404,
        code: 'CASE_NOT_FOUND',
        message: 'Case not found in current tenant',
      },
    }
  }

  const slot = findMaterialSlotById(materialSlotId, tenantId)
  if (!slot) {
    return {
      ok: false,
      error: {
        status: 404,
        code: 'MATERIAL_SLOT_NOT_FOUND',
        message: 'Material slot not found in current tenant',
      },
    }
  }

  if (slot.caseId !== caseId) {
    return {
      ok: false,
      error: {
        status: 409,
        code: 'MATERIAL_SLOT_SCOPE_MISMATCH',
        message: 'Material slot does not belong to the target case',
      },
    }
  }

  return {
    ok: true,
    value: {
      visaCase,
      slot,
    },
  }
}
