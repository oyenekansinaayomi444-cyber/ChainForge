;; Component Tracking Contract
;; Clarity v2
;; Tracks manufacturing component lifecycle with immutable provenance records

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-COMPONENT-ID u101)
(define-constant ERR-ALREADY-REGISTERED u102)
(define-constant ERR-INVALID-ROLE u103)
(define-constant ERR-INVALID-STATUS u104)
(define-constant ERR-ZERO-ADDRESS u105)
(define-constant ERR-MAX-BATCH-EXCEEDED u106)
(define-constant ERR-INVALID-TIMESTAMP u107)

;; Role constants
(define-constant ROLE-ADMIN u1)
(define-constant ROLE-SUPPLIER u2)
(define-constant ROLE-REGULATOR u3)

;; Status constants
(define-constant STATUS-PRODUCED u1)
(define-constant STATUS-TESTED u2)
(define-constant STATUS-SHIPPED u3)
(define-constant STATUS-DELIVERED u4)

;; Contract metadata
(define-constant CONTRACT-NAME "ChainForge Component Tracking")
(define-constant MAX-BATCH-SIZE u100)

;; Contract state
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var last-component-id uint u0)

;; Data maps
(define-map components
  { component-id: uint }
  { serial-number: (string-ascii 64), material: (string-ascii 128), producer: principal, created-at: uint, updated-at: uint }
)
(define-map lifecycle-events
  { component-id: uint, event-index: uint }
  { status: uint, timestamp: uint, notes: (string-ascii 256), recorded-by: principal }
)
(define-map roles { principal: principal } { role: uint })
(define-map event-counters { component-id: uint } { count: uint })

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: validate role
(define-private (has-role (user principal) (required-role uint))
  (let ((user-role (default-to u0 (map-get? roles { principal: user }))))
    (or (is-eq user-role required-role) (is-admin))
  )
)

;; Private helper: validate status
(define-private (is-valid-status (status uint))
  (or (is-eq status STATUS-PRODUCED)
      (is-eq status STATUS-TESTED)
      (is-eq status STATUS-SHIPPED)
      (is-eq status STATUS-DELIVERED))
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq new-admin 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (var-set admin new-admin)
    (ok true)
  )
)

;; Pause/unpause contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (ok pause)
  )
)

;; Assign role to a principal
(define-public (assign-role (user principal) (role uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (is-eq user 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS))
    (asserts! (or (is-eq role ROLE-SUPPLIER) (is-eq role ROLE-REGULATOR)) (err ERR-INVALID-ROLE))
    (map-set roles { principal: user } { role: role })
    (ok true)
  )
)

;; Register a single component
(define-public (register-component (serial-number (string-ascii 64)) (material (string-ascii 128)))
  (begin
    (ensure-not-paused)
    (asserts! (has-role tx-sender ROLE-SUPPLIER) (err ERR-NOT-AUTHORIZED))
    (let ((component-id (+ (var-get last-component-id) u1)))
      (asserts! (is-none (map-get? components { component-id: component-id })) (err ERR-ALREADY-REGISTERED))
      (map-set components
        { component-id: component-id }
        { serial-number: serial-number, material: material, producer: tx-sender, created-at: block-height, updated-at: block-height }
      )
      (map-set event-counters { component-id: component-id } { count: u0 })
      (var-set last-component-id component-id)
      (ok component-id)
    )
  )
)

;; Register multiple components in a batch
(define-public (register-batch (components (list 100 { serial-number: (string-ascii 64), material: (string-ascii 128) })))
  (begin
    (ensure-not-paused)
    (asserts! (has-role tx-sender ROLE-SUPPLIER) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= (len components) MAX-BATCH-SIZE) (err ERR-MAX-BATCH-EXCEEDED))
    (fold register-batch-iter components (ok (var-get last-component-id)))
  )
)

;; Private helper: batch registration iterator
(define-private (register-batch-iter
  (comp { serial-number: (string-ascii 64), material: (string-ascii 128) })
  (last-id (response uint uint))
)
  (match last-id
    current-id
    (let ((component-id (+ current-id u1)))
      (asserts! (is-none (map-get? components { component-id: component-id })) (err ERR-ALREADY-REGISTERED))
      (map-set components
        { component-id: component-id }
        { serial-number: (get serial-number comp), material: (get material comp), producer: tx-sender, created-at: block-height, updated-at: block-height }
      )
      (map-set event-counters { component-id: component-id } { count: u0 })
      (var-set last-component-id component-id)
      (ok component-id)
    )
    error (err error)
  )
)

;; Add lifecycle event
(define-public (add-lifecycle-event (component-id uint) (status uint) (notes (string-ascii 256)))
  (begin
    (ensure-not-paused)
    (asserts! (has-role tx-sender ROLE-SUPPLIER) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-some (map-get? components { component-id: component-id })) (err ERR-INVALID-COMPONENT-ID))
    (asserts! (is-valid-status status) (err ERR-INVALID-STATUS))
    (asserts! (> block-height u0) (err ERR-INVALID-TIMESTAMP))
    (let ((event-index (+ (default-to u0 (map-get? event-counters { component-id: component-id })) u1)))
      (map-set lifecycle-events
        { component-id: component-id, event-index: event-index }
        { status: status, timestamp: block-height, notes: notes, recorded-by: tx-sender }
      )
      (map-set event-counters { component-id: component-id } { count: event-index })
      (map-set components
        { component-id: component-id }
        (merge (unwrap-panic (map-get? components { component-id: component-id }))
               { updated-at: block-height })
      )
      (ok event-index)
    )
  )
)

;; Read-only: get component details
(define-read-only (get-component (component-id uint))
  (match (map-get? components { component-id: component-id })
    component (ok component)
    (err ERR-INVALID-COMPONENT-ID)
  )
)

;; Read-only: get lifecycle event
(define-read-only (get-lifecycle-event (component-id uint) (event-index uint))
  (match (map-get? lifecycle-events { component-id: component-id, event-index: event-index })
    event (ok event)
    (err ERR-INVALID-COMPONENT-ID)
  )
)

;; Read-only: get event count
(define-read-only (get-event-count (component-id uint))
  (ok (default-to u0 (map-get? event-counters { component-id: component-id })))
)

;; Read-only: get role
(define-read-only (get-role (user principal))
  (ok (default-to u0 (map-get? roles { principal: user })))
)

;; Read-only: get admin
(define-read-only (get-admin)
  (ok (var-get admin))
)

;; Read-only: check if paused
(define-read-only (is-paused)
  (ok (var-get paused))
)

;; Read-only: get last component ID
(define-read-only (get-last-component-id)
  (ok (var-get last-component-id))
)