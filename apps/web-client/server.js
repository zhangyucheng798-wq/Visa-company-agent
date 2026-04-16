const http = require('node:http')
const { URL } = require('node:url')

const port = Number(process.env.PORT || 3003)

const cases = [
  {
    caseId: 'case_demo_001',
    visaType: 'B1/B2',
    applicant: 'Alex Chen',
    status: 'intake_in_progress',
    nextStep: 'Upload remaining documents',
    stage: 'Material collection',
    summary: 'Waiting for the client to finish the remaining upload set before internal review.',
    materialsReady: '8 / 12',
    materialSlots: [
      { slotName: 'Passport copy', slotStatus: 'received', latestVersion: 'v2', note: 'Latest passport scan accepted.' },
      { slotName: 'Bank statement', slotStatus: 'missing', latestVersion: '-', note: 'Customer still needs to upload the latest statement.' },
      { slotName: 'Employment proof', slotStatus: 'review_required', latestVersion: 'v1', note: 'Format check flagged for manual follow-up.' },
    ],
    reviewWorkspace: {
      queueStatus: 'Not in review queue yet',
      reviewerFocus: 'Wait for intake completion before review assignment.',
      riskLevel: 'low',
      checklist: ['Confirm all required slots are uploaded', 'Check scan results before queue entry'],
      notes: ['Customer upload still incomplete.'],
    },
    approvalWorkspace: {
      queueStatus: 'Not ready for approval',
      approverFocus: 'Approval starts only after review completion.',
      decisionWindow: 'Pending review hand-off',
      checklist: ['Wait for reviewer summary', 'Do not issue approval decision yet'],
      notes: ['Case remains in intake stage.'],
    },
    clientPortal: {
      clientVisibleStatus: 'Waiting for documents',
      progressLabel: '8 of 12 materials received',
      nextClientAction: 'Upload the latest bank statement and employment proof update.',
      reminders: ['Passport copy is already accepted.', 'Bank statement is still missing.', 'Employment proof needs follow-up after manual review.'],
    },
    uploadFlow: {
      activeSlot: 'Bank statement',
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
      maxSize: '10 MB',
      uploadHint: 'Upload the latest 3-month statement with account holder name visible.',
      steps: ['Choose the required slot', 'Select a file from your device', 'Submit and wait for validation result'],
    },
    supplementRequest: {
      reason: 'Latest bank statement is missing and employment proof needs a clearer file.',
      dueDate: '2026-04-24',
      requestedSlots: ['Bank statement', 'Employment proof'],
      guidance: ['Upload the latest 3-month bank statement.', 'Re-upload employment proof with all text visible.'],
    },
    timelineAudit: [
      { at: '2026-04-12T09:00:00Z', actor: 'case-operator-1', event: 'Case created', detail: 'New B1/B2 intake case opened.' },
      { at: '2026-04-13T11:30:00Z', actor: 'client-alex', event: 'Passport copy uploaded', detail: 'Passport copy v2 accepted.' },
      { at: '2026-04-16T15:10:00Z', actor: 'case-operator-1', event: 'Supplement requested', detail: 'Requested updated bank statement and clearer employment proof.' },
    ],
  },
  {
    caseId: 'case_demo_002',
    visaType: 'F-1',
    applicant: 'Mia Lin',
    status: 'review_in_progress',
    nextStep: 'Reviewer decision pending',
    stage: 'Internal review',
    summary: 'Core intake is complete and the reviewer is checking document quality and consistency.',
    materialsReady: '12 / 12',
    materialSlots: [
      { slotName: 'I-20 form', slotStatus: 'received', latestVersion: 'v1', note: 'Accepted during intake.' },
      { slotName: 'Financial support letter', slotStatus: 'received', latestVersion: 'v2', note: 'Superseded previous upload.' },
      { slotName: 'Academic transcript', slotStatus: 'review_required', latestVersion: 'v1', note: 'Reviewer is validating translation consistency.' },
    ],
    reviewWorkspace: {
      queueStatus: 'Assigned to reviewer queue',
      reviewerFocus: 'Validate transcript translation and confirm financial support coverage.',
      riskLevel: 'medium',
      checklist: ['Check transcript translation consistency', 'Verify support letter validity window', 'Confirm no missing applicant declarations'],
      notes: ['Translation mismatch flagged on one transcript line.', 'Support letter amount is sufficient after v2 upload.'],
    },
    approvalWorkspace: {
      queueStatus: 'Waiting for review completion',
      approverFocus: 'Do not approve until reviewer closes open transcript question.',
      decisionWindow: 'Blocked',
      checklist: ['Wait for reviewer decision', 'Confirm final review note is attached'],
      notes: ['Approval queue entry is blocked by active review work.'],
    },
    clientPortal: {
      clientVisibleStatus: 'Under review',
      progressLabel: 'All required materials received',
      nextClientAction: 'No upload needed right now; wait for review result.',
      reminders: ['I-20 form is accepted.', 'Financial support letter was updated to v2.', 'Academic transcript is under manual review.'],
    },
    uploadFlow: {
      activeSlot: 'Academic transcript',
      acceptedFormats: ['PDF'],
      maxSize: '15 MB',
      uploadHint: 'Only upload if the team asks for a corrected transcript file.',
      steps: ['Review the latest request note', 'Prepare a corrected PDF', 'Upload only when a new request is opened'],
    },
    supplementRequest: {
      reason: 'Transcript translation needs correction on one section.',
      dueDate: '2026-04-22',
      requestedSlots: ['Academic transcript'],
      guidance: ['Upload a corrected translated transcript in PDF format.', 'Keep the original document names aligned with the previous version.'],
    },
    timelineAudit: [
      { at: '2026-04-10T08:20:00Z', actor: 'case-operator-2', event: 'Case created', detail: 'F-1 student visa case opened.' },
      { at: '2026-04-12T13:45:00Z', actor: 'client-mia', event: 'Financial support letter uploaded', detail: 'Financial support letter v2 replaced prior version.' },
      { at: '2026-04-17T10:00:00Z', actor: 'reviewer-1', event: 'Review started', detail: 'Transcript translation inconsistency flagged for follow-up.' },
    ],
  },
  {
    caseId: 'case_demo_003',
    visaType: 'H-1B',
    applicant: 'Ryan Wu',
    status: 'approval_in_progress',
    nextStep: 'Approval conclusion pending',
    stage: 'Approval',
    summary: 'The case is escalated for final approval because of higher review sensitivity.',
    materialsReady: '12 / 12',
    materialSlots: [
      { slotName: 'Petition package', slotStatus: 'received', latestVersion: 'v3', note: 'Final package is locked for approval.' },
      { slotName: 'Client support letter', slotStatus: 'received', latestVersion: 'v1', note: 'No outstanding issues.' },
      { slotName: 'Risk memo', slotStatus: 'review_required', latestVersion: 'v1', note: 'Approver must confirm risk treatment notes.' },
    ],
    reviewWorkspace: {
      queueStatus: 'Review completed',
      reviewerFocus: 'Hand-off complete; approval follow-up only.',
      riskLevel: 'high',
      checklist: ['Confirm review summary is attached', 'Escalate risk memo to approver'],
      notes: ['Reviewer marked case ready for approval with risk escalation.'],
    },
    approvalWorkspace: {
      queueStatus: 'Assigned to approval queue',
      approverFocus: 'Confirm risk memo treatment and petition package readiness before final decision.',
      decisionWindow: 'Ready for approval decision',
      checklist: ['Validate final petition package version', 'Review escalated risk memo', 'Confirm reviewer hand-off is complete'],
      notes: ['Risk memo requires explicit approver acknowledgement.', 'Petition package v3 is the locked final version.'],
    },
    clientPortal: {
      clientVisibleStatus: 'Approval in progress',
      progressLabel: 'All materials complete',
      nextClientAction: 'No action required unless the team asks for clarification.',
      reminders: ['Petition package is locked for approval.', 'Client support letter is accepted.', 'Risk memo is under approver confirmation.'],
    },
    uploadFlow: {
      activeSlot: 'Client support letter',
      acceptedFormats: ['PDF'],
      maxSize: '10 MB',
      uploadHint: 'Upload only if a refreshed support letter is requested during approval.',
      steps: ['Wait for a clarification request', 'Prepare the signed replacement letter', 'Upload the updated PDF to the requested slot'],
    },
    supplementRequest: {
      reason: 'Approval may require a refreshed support letter if clarification is requested.',
      dueDate: '2026-04-28',
      requestedSlots: ['Client support letter'],
      guidance: ['Prepare a newly signed support letter in PDF format.', 'Upload only after the team confirms the clarification request.'],
    },
    timelineAudit: [
      { at: '2026-04-09T07:50:00Z', actor: 'case-operator-3', event: 'Case created', detail: 'H-1B approval-track case opened.' },
      { at: '2026-04-14T16:15:00Z', actor: 'reviewer-2', event: 'Review completed', detail: 'Case escalated to approval with risk memo.' },
      { at: '2026-04-17T09:40:00Z', actor: 'approver-1', event: 'Approval queue assignment', detail: 'Approver assigned to final decision queue.' },
    ],
  },
]

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, 'http://127.0.0.1')
  const path = normalizePathname(requestUrl.pathname)
  const selectedCase = findCaseByPath(path)
  const reviewWorkspaceCase = findReviewWorkspaceCaseByPath(path)
  const approvalWorkspaceCase = findApprovalWorkspaceCaseByPath(path)
  const clientPortalCase = findClientPortalCaseByPath(path)
  const uploadFlowCase = findUploadFlowCaseByPath(path)
  const supplementRequestCase = findSupplementRequestCaseByPath(path)
  const timelineAuditCase = findTimelineAuditCaseByPath(path)
  const isKnownRoute = path === '/' || path === '/cases' || Boolean(selectedCase) || Boolean(reviewWorkspaceCase) || Boolean(approvalWorkspaceCase) || Boolean(clientPortalCase) || Boolean(uploadFlowCase) || Boolean(supplementRequestCase) || Boolean(timelineAuditCase)

  if (!isKnownRoute) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    console.log(JSON.stringify({ app: 'web-client', event: 'request_completed', method: req.method, path, status: 404 }))
    res.end('Not Found')
    return
  }

  if (req.method !== 'GET') {
    res.writeHead(405, {
      'content-type': 'text/plain; charset=utf-8',
      allow: 'GET',
    })
    console.log(JSON.stringify({ app: 'web-client', event: 'request_completed', method: req.method, path, status: 405 }))
    res.end('Method Not Allowed')
    return
  }

  const html = timelineAuditCase
    ? renderTimelineAudit(path, timelineAuditCase)
    : supplementRequestCase
      ? renderSupplementRequest(path, supplementRequestCase)
      : uploadFlowCase
        ? renderUploadFlow(path, uploadFlowCase)
        : clientPortalCase
          ? renderClientPortal(path, clientPortalCase)
          : approvalWorkspaceCase
            ? renderApprovalWorkspace(path, approvalWorkspaceCase)
            : reviewWorkspaceCase
              ? renderReviewWorkspace(path, reviewWorkspaceCase)
              : selectedCase
                ? renderCaseDetail(path, selectedCase)
                : renderCaseList(path)
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  console.log(JSON.stringify({ app: 'web-client', event: 'request_completed', method: req.method, path, status: 200 }))
  res.end(html)
})

server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ app: 'web-client', event: 'server_listening', port, host: '127.0.0.1' }))
})

function renderCaseList(path) {
  const reviewPendingCount = cases.filter((item) => item.status === 'review_in_progress').length
  const approvalPendingCount = cases.filter((item) => item.status === 'approval_in_progress').length
  const rows = cases.map((item) => `
    <tr>
      <td>${escapeHtml(item.caseId)}</td>
      <td>${escapeHtml(item.visaType)}</td>
      <td>${escapeHtml(item.applicant)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml(item.nextStep)}</td>
    </tr>
  `).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client case list</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0 24px; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d7deea; border-radius: 12px; overflow: hidden; }
      th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e8edf5; }
      th { background: #eef2ff; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Case list</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <p>Minimal client view of active cases and next workflow actions.</p>
      <div class="summary">
        <div class="card"><strong>${cases.length}</strong><br />active demo cases</div>
        <div class="card"><strong>${reviewPendingCount}</strong><br />review pending</div>
        <div class="card"><strong>${approvalPendingCount}</strong><br />approval pending</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Visa type</th>
            <th>Applicant</th>
            <th>Status</th>
            <th>Next step</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top: 16px;">Open a detail view at <code>/cases/case_demo_001</code>, <code>/cases/case_demo_002</code>, or <code>/cases/case_demo_003</code>.</p>
    </main>
  </body>
</html>`
}

function renderCaseDetail(path, visaCase) {
  const materialRows = visaCase.materialSlots.map((slot) => `
    <tr>
      <td>${escapeHtml(slot.slotName)}</td>
      <td>${escapeHtml(slot.slotStatus)}</td>
      <td>${escapeHtml(slot.latestVersion)}</td>
      <td>${escapeHtml(slot.note)}</td>
    </tr>
  `).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client case detail</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0 24px; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      .label { color: #5b6477; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { margin-top: 6px; font-size: 18px; }
      .panel-title { margin: 24px 0 12px; }
      table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d7deea; border-radius: 12px; overflow: hidden; }
      th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e8edf5; vertical-align: top; }
      th { background: #eef2ff; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
      a { color: #3157d5; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <p><a href="/cases">← Back to case list</a></p>
      <h1>Case detail</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <p>${escapeHtml(visaCase.summary)}</p>
      <div class="grid">
        <div class="card"><div class="label">Case ID</div><div class="value">${escapeHtml(visaCase.caseId)}</div></div>
        <div class="card"><div class="label">Applicant</div><div class="value">${escapeHtml(visaCase.applicant)}</div></div>
        <div class="card"><div class="label">Visa type</div><div class="value">${escapeHtml(visaCase.visaType)}</div></div>
        <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(visaCase.status)}</div></div>
        <div class="card"><div class="label">Current stage</div><div class="value">${escapeHtml(visaCase.stage)}</div></div>
        <div class="card"><div class="label">Materials ready</div><div class="value">${escapeHtml(visaCase.materialsReady)}</div></div>
      </div>
      <div class="card">
        <div class="label">Next step</div>
        <div class="value">${escapeHtml(visaCase.nextStep)}</div>
      </div>
      <h2 class="panel-title">Material slot panel</h2>
      <table>
        <thead>
          <tr>
            <th>Slot</th>
            <th>Status</th>
            <th>Latest version</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>${materialRows}</tbody>
      </table>
      <p style="margin-top: 16px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/review-workspace">Open review workspace</a></p>
      <p style="margin-top: 8px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/approval-workspace">Open approval workspace</a></p>
      <p style="margin-top: 8px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/client-portal">Open client portal</a></p>
      <p style="margin-top: 8px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/upload-flow">Open upload flow</a></p>
      <p style="margin-top: 8px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/supplement-request">Open supplement request</a></p>
      <p style="margin-top: 8px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/timeline-audit">Open timeline audit</a></p>
    </main>
  </body>
</html>`
}

function renderReviewWorkspace(path, visaCase) {
  const checklistItems = visaCase.reviewWorkspace.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const notesItems = visaCase.reviewWorkspace.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client review workspace</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0 24px; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      .label { color: #5b6477; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { margin-top: 6px; font-size: 18px; }
      ul { margin: 8px 0 0 20px; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
      a { color: #3157d5; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <p><a href="/cases/${escapeHtml(visaCase.caseId)}">← Back to case detail</a></p>
      <h1>Review workspace</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <p>${escapeHtml(visaCase.summary)}</p>
      <div class="grid">
        <div class="card"><div class="label">Case ID</div><div class="value">${escapeHtml(visaCase.caseId)}</div></div>
        <div class="card"><div class="label">Queue status</div><div class="value">${escapeHtml(visaCase.reviewWorkspace.queueStatus)}</div></div>
        <div class="card"><div class="label">Reviewer focus</div><div class="value">${escapeHtml(visaCase.reviewWorkspace.reviewerFocus)}</div></div>
        <div class="card"><div class="label">Risk level</div><div class="value">${escapeHtml(visaCase.reviewWorkspace.riskLevel)}</div></div>
      </div>
      <div class="card">
        <div class="label">Checklist</div>
        <ul>${checklistItems}</ul>
      </div>
      <div class="card" style="margin-top: 16px;">
        <div class="label">Reviewer notes</div>
        <ul>${notesItems}</ul>
      </div>
    </main>
  </body>
</html>`
}

function renderApprovalWorkspace(path, visaCase) {
  const checklistItems = visaCase.approvalWorkspace.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const notesItems = visaCase.approvalWorkspace.notes.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client approval workspace</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0 24px; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      .label { color: #5b6477; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { margin-top: 6px; font-size: 18px; }
      ul { margin: 8px 0 0 20px; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
      a { color: #3157d5; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <p><a href="/cases/${escapeHtml(visaCase.caseId)}">← Back to case detail</a></p>
      <h1>Approval workspace</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <p>${escapeHtml(visaCase.summary)}</p>
      <div class="grid">
        <div class="card"><div class="label">Case ID</div><div class="value">${escapeHtml(visaCase.caseId)}</div></div>
        <div class="card"><div class="label">Queue status</div><div class="value">${escapeHtml(visaCase.approvalWorkspace.queueStatus)}</div></div>
        <div class="card"><div class="label">Approver focus</div><div class="value">${escapeHtml(visaCase.approvalWorkspace.approverFocus)}</div></div>
        <div class="card"><div class="label">Decision window</div><div class="value">${escapeHtml(visaCase.approvalWorkspace.decisionWindow)}</div></div>
      </div>
      <div class="card">
        <div class="label">Checklist</div>
        <ul>${checklistItems}</ul>
      </div>
      <div class="card" style="margin-top: 16px;">
        <div class="label">Approver notes</div>
        <ul>${notesItems}</ul>
      </div>
    </main>
  </body>
</html>`
}

function renderClientPortal(path, visaCase) {
  const reminderItems = visaCase.clientPortal.reminders.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client client portal</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0 24px; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      .label { color: #5b6477; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { margin-top: 6px; font-size: 18px; }
      ul { margin: 8px 0 0 20px; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
      a { color: #3157d5; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <p><a href="/cases/${escapeHtml(visaCase.caseId)}">← Back to case detail</a></p>
      <h1>Client portal</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <p>${escapeHtml(visaCase.summary)}</p>
      <div class="grid">
        <div class="card"><div class="label">Case ID</div><div class="value">${escapeHtml(visaCase.caseId)}</div></div>
        <div class="card"><div class="label">Client-visible status</div><div class="value">${escapeHtml(visaCase.clientPortal.clientVisibleStatus)}</div></div>
        <div class="card"><div class="label">Progress</div><div class="value">${escapeHtml(visaCase.clientPortal.progressLabel)}</div></div>
        <div class="card"><div class="label">Next client action</div><div class="value">${escapeHtml(visaCase.clientPortal.nextClientAction)}</div></div>
      </div>
      <div class="card">
        <div class="label">Reminders</div>
        <ul>${reminderItems}</ul>
      </div>
      <p style="margin-top: 16px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/upload-flow">Open upload flow</a></p>
      <p style="margin-top: 8px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/supplement-request">Open supplement request</a></p>
    </main>
  </body>
</html>`
}

function renderUploadFlow(path, visaCase) {
  const acceptedFormats = visaCase.uploadFlow.acceptedFormats.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const steps = visaCase.uploadFlow.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client upload flow</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0 24px; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      .label { color: #5b6477; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { margin-top: 6px; font-size: 18px; }
      ul { margin: 8px 0 0 20px; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
      a { color: #3157d5; text-decoration: none; }
      .upload-box { border: 2px dashed #b8c4dd; border-radius: 12px; padding: 20px; background: #fff; margin-top: 16px; }
    </style>
  </head>
  <body>
    <main>
      <p><a href="/cases/${escapeHtml(visaCase.caseId)}/client-portal">← Back to client portal</a></p>
      <h1>Upload flow</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <div class="grid">
        <div class="card"><div class="label">Case ID</div><div class="value">${escapeHtml(visaCase.caseId)}</div></div>
        <div class="card"><div class="label">Active slot</div><div class="value">${escapeHtml(visaCase.uploadFlow.activeSlot)}</div></div>
        <div class="card"><div class="label">Max size</div><div class="value">${escapeHtml(visaCase.uploadFlow.maxSize)}</div></div>
        <div class="card"><div class="label">Upload hint</div><div class="value">${escapeHtml(visaCase.uploadFlow.uploadHint)}</div></div>
      </div>
      <div class="card">
        <div class="label">Accepted formats</div>
        <ul>${acceptedFormats}</ul>
      </div>
      <div class="card" style="margin-top: 16px;">
        <div class="label">Upload steps</div>
        <ul>${steps}</ul>
      </div>
      <div class="upload-box">
        <strong>Upload area</strong>
        <p>Select a file for <code>${escapeHtml(visaCase.uploadFlow.activeSlot)}</code> and submit it for validation.</p>
      </div>
      <p style="margin-top: 16px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/supplement-request">Open supplement request</a></p>
    </main>
  </body>
</html>`
}

function renderSupplementRequest(path, visaCase) {
  const requestedSlots = visaCase.supplementRequest.requestedSlots.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const guidanceItems = visaCase.supplementRequest.guidance.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client supplement request</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0 24px; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      .label { color: #5b6477; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { margin-top: 6px; font-size: 18px; }
      ul { margin: 8px 0 0 20px; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
      a { color: #3157d5; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <p><a href="/cases/${escapeHtml(visaCase.caseId)}/upload-flow">← Back to upload flow</a></p>
      <h1>Supplement request</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <div class="grid">
        <div class="card"><div class="label">Case ID</div><div class="value">${escapeHtml(visaCase.caseId)}</div></div>
        <div class="card"><div class="label">Due date</div><div class="value">${escapeHtml(visaCase.supplementRequest.dueDate)}</div></div>
        <div class="card"><div class="label">Reason</div><div class="value">${escapeHtml(visaCase.supplementRequest.reason)}</div></div>
        <div class="card"><div class="label">Next step</div><div class="value">${escapeHtml(visaCase.nextStep)}</div></div>
      </div>
      <div class="card">
        <div class="label">Requested slots</div>
        <ul>${requestedSlots}</ul>
      </div>
      <div class="card" style="margin-top: 16px;">
        <div class="label">Client guidance</div>
        <ul>${guidanceItems}</ul>
      </div>
      <p style="margin-top: 16px;"><a href="/cases/${escapeHtml(visaCase.caseId)}/timeline-audit">Open timeline audit</a></p>
    </main>
  </body>
</html>`
}

function renderTimelineAudit(path, visaCase) {
  const timelineItems = visaCase.timelineAudit.map((item) => `
    <li style="margin-bottom: 16px;">
      <strong>${escapeHtml(item.event)}</strong><br />
      <span>${escapeHtml(item.at)}</span><br />
      <span>${escapeHtml(item.actor)}</span><br />
      <span>${escapeHtml(item.detail)}</span>
    </li>
  `).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>web-client timeline audit</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; background: #f5f7fb; color: #172033; }
      main { max-width: 960px; margin: 0 auto; }
      .card { background: #fff; border: 1px solid #d7deea; border-radius: 12px; padding: 16px; }
      .label { color: #5b6477; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .value { margin-top: 6px; font-size: 18px; }
      ul { margin: 8px 0 0 20px; }
      code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
      a { color: #3157d5; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <p><a href="/cases/${escapeHtml(visaCase.caseId)}">← Back to case detail</a></p>
      <h1>Timeline audit</h1>
      <p>Current path: <code>${escapeHtml(path)}</code></p>
      <div class="card">
        <div class="label">Case ID</div>
        <div class="value">${escapeHtml(visaCase.caseId)}</div>
      </div>
      <div class="card" style="margin-top: 16px;">
        <div class="label">Timeline events</div>
        <ul>${timelineItems}</ul>
      </div>
    </main>
  </body>
</html>`
}

function findCaseByPath(path) {
  if (!path.startsWith('/cases/')) {
    return null
  }

  const suffix = path.slice('/cases/'.length)
  if (suffix.includes('/')) {
    return null
  }

  return cases.find((item) => item.caseId === suffix) || null
}

function findReviewWorkspaceCaseByPath(path) {
  if (!path.startsWith('/cases/')) {
    return null
  }

  const match = path.match(/^\/cases\/([^/]+)\/review-workspace$/)
  if (!match) {
    return null
  }

  return cases.find((item) => item.caseId === match[1]) || null
}

function findApprovalWorkspaceCaseByPath(path) {
  if (!path.startsWith('/cases/')) {
    return null
  }

  const match = path.match(/^\/cases\/([^/]+)\/approval-workspace$/)
  if (!match) {
    return null
  }

  return cases.find((item) => item.caseId === match[1]) || null
}

function findClientPortalCaseByPath(path) {
  if (!path.startsWith('/cases/')) {
    return null
  }

  const match = path.match(/^\/cases\/([^/]+)\/client-portal$/)
  if (!match) {
    return null
  }

  return cases.find((item) => item.caseId === match[1]) || null
}

function findUploadFlowCaseByPath(path) {
  if (!path.startsWith('/cases/')) {
    return null
  }

  const match = path.match(/^\/cases\/([^/]+)\/upload-flow$/)
  if (!match) {
    return null
  }

  return cases.find((item) => item.caseId === match[1]) || null
}

function findSupplementRequestCaseByPath(path) {
  if (!path.startsWith('/cases/')) {
    return null
  }

  const match = path.match(/^\/cases\/([^/]+)\/supplement-request$/)
  if (!match) {
    return null
  }

  return cases.find((item) => item.caseId === match[1]) || null
}

function findTimelineAuditCaseByPath(path) {
  if (!path.startsWith('/cases/')) {
    return null
  }

  const match = path.match(/^\/cases\/([^/]+)\/timeline-audit$/)
  if (!match) {
    return null
  }

  return cases.find((item) => item.caseId === match[1]) || null
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizePathname(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}
