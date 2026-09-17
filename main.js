/**
 * ============================================================================
 * SEVAKHATA — THE MONUMENTAL MUTUAL LEDGER
 * State Machine, Direct Manipulation & Restrained Motion Engine
 * Crafted with Apple Design Fluidity & Emil Kowalski Design Discipline
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroScrollChoreography();
  initHeroConsensusInteraction();
  initTwoSidedMemoryParallax();
  initConsensusLifecycleStepper();
  initSmoothScrollLinks();
});

/**
 * ----------------------------------------------------------------------------
 * 01. HERO STAGED SCROLL CHOREOGRAPHY (Spatial Layering & Staged Reveal)
 * ----------------------------------------------------------------------------
 * State 0: Unobscured monumental typography & thesis.
 * State 1: On scroll, SEVAKHATA recedes gracefully into the architectural layer
 *          while the Living Khata Slab reaches its designated resting position.
 */
function initHeroScrollChoreography() {
  const heroTypography = document.getElementById('heroTypography');
  const heroScrollCue = document.getElementById('heroScrollCue');
  const livingKhataObject = document.getElementById('livingKhataObject');
  const heroSection = document.getElementById('hero');

  if (!heroTypography || !heroSection) return;

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroHeight = heroSection.offsetHeight || 1200;

        if (scrollY <= heroHeight) {
          const progress = Math.min(scrollY / (heroHeight * 0.45), 1);
          
          // Typography recedes: subtle scale (1 -> 0.96), translation, and controlled opacity
          const translateY = scrollY * 0.22;
          const opacity = Math.max(1 - progress * 0.55, 0.45);
          const scale = 1 - progress * 0.04;
          
          heroTypography.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
          heroTypography.style.opacity = opacity.toFixed(2);

          // Scroll cue fades out quickly on scroll
          if (heroScrollCue) {
            const cueOpacity = Math.max(1 - (scrollY / 180), 0);
            heroScrollCue.style.opacity = cueOpacity.toFixed(2);
            heroScrollCue.style.pointerEvents = cueOpacity <= 0 ? 'none' : 'auto';
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * ----------------------------------------------------------------------------
 * 02. HERO CONSENSUS INTERACTION (Direct Manipulation Causal Chain)
 * ----------------------------------------------------------------------------
 * Causal Sequence on "✓ Sahi Hai":
 *   1. Button press feedback & tactile response
 *   2. Active record transitions to confirmed state
 *   3. Quarantine badge clears -> Confirmed & Sealed
 *   4. Weight badge reflects inclusion (+₹500)
 *   5. Dual acknowledgement note appears
 *   6. Financial counter springs from ₹3,000 -> ₹3,500
 *   7. Month-end hisaab climax elements update synchronously
 */
function initHeroConsensusInteraction() {
  const btnConfirm = document.getElementById('btnConfirm');
  const btnDispute = document.getElementById('btnDispute');
  const activeRecord = document.getElementById('activeTodayRecord');
  const quarantinePill = document.getElementById('quarantinePill');
  const weightNote = document.getElementById('weightNote');
  const activeWeightBadge = document.getElementById('activeWeightBadge');
  const runningTotal = document.getElementById('runningTotalNumber');
  const formulaDisplay = document.getElementById('formulaDisplay');
  const quarantineNote = document.getElementById('quarantineNote');
  const sealPill = document.getElementById('sealPill');

  // Climax section mirror elements
  const equationResult = document.getElementById('equationResult');
  const climaxNumeral = document.getElementById('climaxNumeral');

  if (!btnConfirm || !btnDispute || !activeRecord) return;

  // State machine values: 'pending' | 'confirmed' | 'disputed'
  let currentState = 'pending';
  let animationFrameId = null;

  // Critically damped spring counter animation (Apple 1.0 damping, no wobble)
  function animateCounter(elements, targetVal, duration = 320) {
    if (!elements || elements.length === 0) return;
    
    const validElements = elements.filter(Boolean);
    if (validElements.length === 0) return;

    const firstEl = validElements[0];
    const startVal = parseInt(firstEl.textContent.replace(/[^0-9]/g, ''), 10) || 3000;
    const startTime = performance.now();

    validElements.forEach(el => el.classList.add('highlight-change'));

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Apple cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetVal - startVal) * ease);
      const formatted = `₹${current.toLocaleString('en-IN')}`;

      validElements.forEach(el => {
        el.textContent = formatted;
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        setTimeout(() => {
          validElements.forEach(el => el.classList.remove('highlight-change'));
        }, 280);
      }
    }

    animationFrameId = requestAnimationFrame(update);
  }

  function applyState(nextState) {
    currentState = nextState;

    if (nextState === 'confirmed') {
      btnConfirm.classList.add('active-action');
      btnDispute.classList.remove('active-action');

      activeRecord.classList.remove('state-disputed');
      activeRecord.classList.add('state-confirmed');

      if (quarantinePill) {
        quarantinePill.className = 'semantic-state-pill confirmed';
        quarantinePill.innerHTML = '<span class="pill-dot" aria-hidden="true"></span><span class="pill-label">CONFIRMED</span>';
      }

      if (weightNote) {
        weightNote.className = 'active-invariant-note confirmed';
        weightNote.textContent = '✓ Confirmed by Sunita Didi · Included in official shared hisaab.';
      }

      animateCounter([runningTotal, equationResult, climaxNumeral], 3500);

      if (formulaDisplay) {
        formulaDisplay.textContent = 'Confirmed Work (+₹4,500) − Advance (−₹1,000) = ₹3,500 Net Due';
      }
      if (quarantineNote) {
        quarantineNote.textContent = '* Today’s ₹500 is mutually confirmed. Both phones reflect ₹3,500.';
      }
      if (sealPill) {
        sealPill.style.borderColor = 'var(--emerald-core)';
        sealPill.style.background = 'rgba(5, 150, 105, 0.2)';
      }
    } else if (nextState === 'disputed') {
      btnDispute.classList.add('active-action');
      btnConfirm.classList.remove('active-action');

      activeRecord.classList.remove('state-confirmed');
      activeRecord.classList.add('state-disputed');

      if (quarantinePill) {
        quarantinePill.className = 'semantic-state-pill disputed';
        quarantinePill.innerHTML = '<span class="pill-dot" aria-hidden="true"></span><span class="pill-label">DISPUTED</span>';
      }

      if (weightNote) {
        weightNote.className = 'active-invariant-note disputed';
        weightNote.textContent = '⚠️ Contested by Sunita Didi · Quarantined at ₹0.00 until clarified.';
      }

      animateCounter([runningTotal, equationResult, climaxNumeral], 3000);

      if (formulaDisplay) {
        formulaDisplay.textContent = 'Confirmed Work (+₹4,000) − Advance (−₹1,000) = ₹3,000 Net Due';
      }
      if (quarantineNote) {
        quarantineNote.textContent = '* Disputed entry is quarantined. Official shared hisaab remains undisturbed at ₹3,000.';
      }
      if (sealPill) {
        sealPill.style.borderColor = 'var(--rose-border)';
        sealPill.style.background = 'rgba(239, 68, 68, 0.15)';
      }
    } else {
      // Revert to pending
      btnConfirm.classList.remove('active-action');
      btnDispute.classList.remove('active-action');

      activeRecord.classList.remove('state-confirmed', 'state-disputed');

      if (quarantinePill) {
        quarantinePill.className = 'semantic-state-pill pending';
        quarantinePill.innerHTML = '<span class="pill-dot" aria-hidden="true"></span><span class="pill-label">PENDING</span>';
      }

      if (weightNote) {
        weightNote.className = 'active-invariant-note';
        weightNote.textContent = '* Recorded by employer. Holds ₹0.00 until Sunita confirms.';
      }

      animateCounter([runningTotal, equationResult, climaxNumeral], 3000);

      if (formulaDisplay) {
        formulaDisplay.textContent = 'Confirmed Work (+₹4,000) − Advance (−₹1,000) = ₹3,000 Net Due';
      }
      if (quarantineNote) {
        quarantineNote.textContent = '* Today’s ₹500 is pending confirmation. Tap "Sahi Hai" to include it in the hisaab.';
      }
      if (sealPill) {
        sealPill.style.borderColor = '';
        sealPill.style.background = '';
      }
    }
  }

  // Confirm Action: Sunita taps "Sahi Hai · सही है"
  btnConfirm.addEventListener('click', () => {
    btnConfirm.style.transform = 'scale(0.96)';
    setTimeout(() => { btnConfirm.style.transform = ''; }, 120);

    if (currentState === 'confirmed') {
      applyState('pending');
    } else {
      applyState('confirmed');
    }
  });

  // Dispute Action: Sunita taps "Galat Hai · गलत है"
  btnDispute.addEventListener('click', () => {
    btnDispute.style.transform = 'scale(0.96)';
    setTimeout(() => { btnDispute.style.transform = ''; }, 120);

    if (currentState === 'disputed') {
      applyState('pending');
    } else {
      applyState('disputed');
    }
  });
}

/**
 * ----------------------------------------------------------------------------
 * 03. DYNAMIC TWO-SIDED MEMORY PARALLAX & CONVERGENCE
 * ----------------------------------------------------------------------------
 * Explanatory Motion:
 *   Left (Employer) and Right (Helper) cards subtly shift and converge towards
 *   the central invariant axis as the user scrolls into Movement 02.
 */
function initTwoSidedMemoryParallax() {
  const diagnosticSection = document.getElementById('diagnostic');
  const memCardLeft = document.getElementById('memCardLeft');
  const memCardRight = document.getElementById('memCardRight');

  if (!diagnosticSection || !memCardLeft || !memCardRight) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // Only apply parallax on screens wider than 1024px where side-by-side exists
  if (window.innerWidth <= 1024) return;

  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const rect = diagnosticSection.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // When section enters viewport
        if (rect.top < windowHeight && rect.bottom > 0) {
          const totalDistance = windowHeight + rect.height;
          const currentProgress = (windowHeight - rect.top) / totalDistance;
          // Normalized progress between 0 and 1
          const p = Math.max(0, Math.min(1, currentProgress));

          // Subtle horizontal convergence: cards move 14px toward center
          // Slight micro-rotation: -0.8deg -> 0deg and +0.8deg -> 0deg
          const leftShift = (1 - p) * -16;
          const rightShift = (1 - p) * 16;
          const leftRotate = (1 - p) * -0.7;
          const rightRotate = (1 - p) * 0.7;

          memCardLeft.style.transform = `translate3d(${leftShift.toFixed(1)}px, 0, 0) rotate(${leftRotate.toFixed(2)}deg)`;
          memCardRight.style.transform = `translate3d(${rightShift.toFixed(1)}px, 0, 0) rotate(${rightRotate.toFixed(2)}deg)`;
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * ----------------------------------------------------------------------------
 * 04. CONSENSUS ENGINE LIFECYCLE STEPPER (Continuous Shared-Element Morph)
 * ----------------------------------------------------------------------------
 * The same physical record object transforms across 3 stages:
 *   Stage 01: Logged (Quarantined, Zero Weight)
 *   Stage 02: Awaiting Helper Review (Delivered to Sunita's Mobile)
 *   Stage 03: Mutual Consensus Sealed (Dual Signed, Weight +₹500)
 */
function initConsensusLifecycleStepper() {
  const tabs = [
    document.getElementById('stepTab1'),
    document.getElementById('stepTab2'),
    document.getElementById('stepTab3')
  ];

  const simBtns = [
    document.getElementById('btnSimStep1'),
    document.getElementById('btnSimStep2'),
    document.getElementById('btnSimStep3')
  ];

  const consensusCard = document.getElementById('consensusCard');
  const consensusIcon = document.getElementById('consensusIcon');
  const consensusStatusText = document.getElementById('consensusStatusText');
  const consensusTitle = document.getElementById('consensusTitle');
  const consensusNarrative = document.getElementById('consensusNarrative');
  const consensusHindiQuote = document.getElementById('consensusHindiQuote');
  const consensusAmountDisplay = document.getElementById('consensusAmountDisplay');
  const consensusWeightIndicator = document.getElementById('consensusWeightIndicator');

  if (!consensusCard) return;

  const stageData = [
    {
      badgeClass: 'stage-badge quarantined',
      spineColor: 'var(--amber-core)',
      icon: '⏱',
      status: 'STAGE 01 · QUARANTINED (ZERO WEIGHT)',
      title: 'Full Day Housework & Cooking Logged',
      narrative: 'Sharma Ji logs today’s attendance. Under SevaKhata’s mutual rule, this entry is held in strict quarantine. It holds ₹0.00 financial gravity and cannot alter what is owed until acknowledged.',
      hindiQuote: '"जब तक सुनीता दीदी \'सही है\' नहीं दबाएंगी, यह रकम हिसाब में नहीं जुड़ेगी।"',
      amount: '+₹500',
      weight: 'Weight on Hisaab: ₹0.00',
      weightColor: 'var(--amber-core)'
    },
    {
      badgeClass: 'stage-badge reviewing',
      spineColor: '#38BDF8',
      icon: '📱',
      status: 'STAGE 02 · AWAITING HELPER REVIEW',
      title: 'Review Prompt Delivered to Sunita’s Phone',
      narrative: 'Sunita Didi receives a lightweight, respectful prompt in Hindi on her own mobile phone: "क्या 13 अगस्त का यह काम सही है?" She holds complete, equal agency to verify or dispute.',
      hindiQuote: '"सुनीता दीदी ने काम खत्म कर अपने फोन पर प्रविष्टि की समीक्षा की।"',
      amount: '+₹500',
      weight: 'Weight on Hisaab: ₹0.00 (Pending Review)',
      weightColor: '#38BDF8'
    },
    {
      badgeClass: 'stage-badge sealed',
      spineColor: 'var(--emerald-core)',
      icon: '✓',
      status: 'STAGE 03 · MUTUAL CONSENSUS SEALED',
      title: 'Confirmed & Committed into Shared Truth',
      narrative: 'Sunita taps "सही है". Both sides have confirmed the record. The ₹500 joins the ledger, contributing to the official shared hisaab.',
      hindiQuote: '"दोनों ने माना, हिसाब पक्का हुआ — न कोई संकोच, न कोई विवाद।"',
      amount: '+₹500',
      weight: 'Weight on Hisaab: +₹500.00 (Official)',
      weightColor: '#34D399'
    }
  ];

  function setStage(index) {
    const data = stageData[index];
    if (!data) return;

    // Update active tab navigation buttons
    tabs.forEach((tab, i) => {
      if (tab) {
        tab.classList.toggle('active', i === index);
        tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
      }
    });

    // Update simulator pill buttons
    simBtns.forEach((btn, i) => {
      if (btn) btn.classList.toggle('active', i === index);
    });

    // Emil Kowalski Morph Transition: micro-scale & subtle opacity dip
    consensusCard.style.opacity = '0.72';
    consensusCard.style.transform = 'scale(0.995)';

    setTimeout(() => {
      const spine = consensusCard.querySelector('.stage-card-spine');
      if (spine) spine.style.backgroundColor = data.spineColor;

      if (consensusIcon) consensusIcon.textContent = data.icon;
      if (consensusStatusText) consensusStatusText.textContent = data.status;
      if (consensusTitle) consensusTitle.textContent = data.title;
      if (consensusNarrative) consensusNarrative.textContent = data.narrative;
      if (consensusHindiQuote) consensusHindiQuote.textContent = data.hindiQuote;
      if (consensusHindiQuote) consensusHindiQuote.style.color = data.spineColor;
      if (consensusAmountDisplay) consensusAmountDisplay.textContent = data.amount;
      if (consensusWeightIndicator) {
        consensusWeightIndicator.textContent = data.weight;
        consensusWeightIndicator.style.color = data.weightColor;
      }

      consensusCard.style.opacity = '1';
      consensusCard.style.transform = 'scale(1)';
    }, 120);
  }

  tabs.forEach((tab, index) => {
    if (tab) tab.addEventListener('click', () => setStage(index));
  });

  simBtns.forEach((btn, index) => {
    if (btn) btn.addEventListener('click', () => setStage(index));
  });
}

/**
 * ----------------------------------------------------------------------------
 * 05. SMOOTH SCROLL FOR IN-PAGE ANCHORS
 * ----------------------------------------------------------------------------
 */
function initSmoothScrollLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      if (!targetId) return;

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
