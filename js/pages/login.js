/**
 * SevaKhata — Premium Floating Login Interaction & Motion Controller.
 * 
 * Features:
 *  - Apple Design-inspired 3D perspective tilt & specular lighting physics
 *  - Emil Kowalski motion principles (spring damping, tactile button active states, no scale(0))
 *  - Seamless mode switching between Email and Mobile OTP authentication
 *  - Tactile password visibility toggle
 *  - 6-digit auto-advancing OTP input with paste distribution
 *  - Accessible form validation and bilingual translation support
 */
(function () {
  'use strict';

  const I = window.SKI18N;
  const UI = window.SKUI;
  const V = window.SKValidate;
  const t = I.t;
  const fmt = I.fmt;

  document.addEventListener('DOMContentLoaded', () => {
    I.init();
    UI.init();

    const card = document.getElementById('loginFolioCard');
    const viewport = document.getElementById('loginCardViewport');
    const emailForm = document.getElementById('loginEmailForm');
    const mobileForm = document.getElementById('loginMobileForm');
    const tabEmail = document.getElementById('tabEmail');
    const tabMobile = document.getElementById('tabMobile');
    const paneEmail = document.getElementById('paneEmail');
    const paneMobile = document.getElementById('paneMobile');

    /* ----------------------------------------------------------------------
       01. 3D PERSPECTIVE TILT & SPECULAR SHEEN (PHYSICS ENGINE)
       ---------------------------------------------------------------------- */
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchOnly = window.matchMedia('(hover: none)').matches;

    if (!isReducedMotion && !isTouchOnly && card && viewport) {
      let currentX = 0;
      let currentY = 0;
      let targetX = 0;
      let targetY = 0;
      let isHovering = false;
      let rafId = null;

      const maxTiltDeg = 6.5; // Restrained, dignified maximum tilt

      function updateTilt() {
        // Critically damped spring-like lerp interpolation (factor 0.08)
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;

        card.style.transform = `perspective(1200px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg)`;

        // Continue the animation loop until settled near target
        if (isHovering || Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
          rafId = requestAnimationFrame(updateTilt);
        } else {
          card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
          rafId = null;
        }
      }

      function onPointerMove(e) {
        const rect = card.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Position relative to card center from -1 to 1
        const normX = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
        const normY = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));

        targetX = -normY * maxTiltDeg;
        targetY = normX * maxTiltDeg;

        // Specular highlight follow
        const relX = ((clientX - rect.left) / rect.width) * 100;
        const relY = ((clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${relX.toFixed(1)}%`);
        card.style.setProperty('--mouse-y', `${relY.toFixed(1)}%`);

        if (!rafId) {
          isHovering = true;
          rafId = requestAnimationFrame(updateTilt);
        }
      }

      function onPointerLeave() {
        isHovering = false;
        targetX = 0;
        targetY = 0;
        if (!rafId) rafId = requestAnimationFrame(updateTilt);
      }

      viewport.addEventListener('pointermove', onPointerMove);
      viewport.addEventListener('pointerleave', onPointerLeave);
    }

    /* ----------------------------------------------------------------------
       02. AUTHENTICATION MODE SWITCHER (EMAIL <-> MOBILE)
       ---------------------------------------------------------------------- */
    function setMode(mode) {
      const isEmail = mode === 'email';
      tabEmail.setAttribute('aria-selected', String(isEmail));
      tabMobile.setAttribute('aria-selected', String(!isEmail));

      if (isEmail) {
        paneMobile.classList.add('is-inactive');
        paneEmail.classList.remove('is-inactive');
        const firstInput = emailForm.querySelector('input');
        if (firstInput) firstInput.focus();
      } else {
        paneEmail.classList.add('is-inactive');
        paneMobile.classList.remove('is-inactive');
        const firstInput = mobileForm.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }

    tabEmail.addEventListener('click', () => setMode('email'));
    tabMobile.addEventListener('click', () => setMode('mobile'));

    // Support deep linking to mobile tab (?tab=mobile or #mobile)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'mobile' || window.location.hash === '#mobile') {
      setMode('mobile');
    }

    /* ----------------------------------------------------------------------
       03. PASSWORD VISIBILITY TOGGLE
       ---------------------------------------------------------------------- */
    const passInput = document.getElementById('loginPassword');
    const togglePassBtn = document.getElementById('btnTogglePassword');
    if (passInput && togglePassBtn) {
      togglePassBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.setAttribute('aria-pressed', String(isPass));
        togglePassBtn.setAttribute('aria-label', isPass ? t('login.hidePass', 'Hide password') : t('login.showPass', 'Show password'));
        const eyeOpen = togglePassBtn.querySelector('.eye-open');
        const eyeClosed = togglePassBtn.querySelector('.eye-closed');
        if (eyeOpen && eyeClosed) {
          eyeOpen.style.display = isPass ? 'none' : 'block';
          eyeClosed.style.display = isPass ? 'block' : 'none';
        }
      });
    }

    /* ----------------------------------------------------------------------
       04. FORGOT PASSWORD MODAL
       ---------------------------------------------------------------------- */
    const forgotBtn = document.getElementById('btnForgotPass');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        UI.modal({
          title: t('login.forgotTitle', 'Password Assistance'),
          body: UI.h('div', {},
            UI.h('p', { text: t('login.forgotBody', 'In this Evaluation 2 preview, live email delivery is mocked. For account recovery assistance or help logging in, please contact support or use Mobile login.') }),
            UI.h('p', { class: 'note-box info', style: 'margin-top: 1rem;', text: 'Tip: You can switch to Mobile Number login above to access your ledger instantly via demo SMS OTP verification.' })
          ),
          actions: [
            { label: t('common.close', 'Close'), primary: true },
            { label: t('nav.support', 'Support'), onClick: () => { location.href = 'contact-feedback.html'; }, close: false }
          ]
        });
      });
    }

    /* ----------------------------------------------------------------------
       05. REMEMBER ME (PREFERENCE PERSISTENCE)
       ---------------------------------------------------------------------- */
    const rememberCheckbox = document.getElementById('loginRemember');
    const savedEmail = localStorage.getItem('sk_remember_email');
    if (savedEmail && emailForm.elements.email) {
      emailForm.elements.email.value = savedEmail;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    /* ----------------------------------------------------------------------
       06. EMAIL LOGIN FORM (FORM 1)
       ---------------------------------------------------------------------- */
    UI.bindForm(emailForm, V.SCHEMAS.loginEmail, {
      async onSubmit(vals, { setBusy }) {
        if (rememberCheckbox && rememberCheckbox.checked) {
          localStorage.setItem('sk_remember_email', vals.email);
        } else {
          localStorage.removeItem('sk_remember_email');
        }

        const res = await window.SKStore.create('logins', {
          method: 'email',
          email: vals.email,
          password: vals.password,
          remember: Boolean(rememberCheckbox && rememberCheckbox.checked)
        });

        sessionStorage.setItem('sk_user_session', JSON.stringify({
          id: res.record.id,
          type: 'email',
          identifier: res.record.identifier,
          role: res.record.role,
          name: res.record.name,
          signedInAt: res.record.createdAt,
          via: res.via
        }));

        UI.toast(t('login.success', 'Signed in successfully. Welcome to SevaKhata.'), 'success');

        UI.successModal({
          title: t('login.title', 'Enter the Ledger'),
          lines: [
            fmt('login.welcomeMsg', { user: res.record.name || vals.email }, 'Authentication verified for {user}.'),
            'Your mutual ledger records and pending settlements are synchronized.'
          ],
          reference: res.record.id,
          via: res.via,
          actions: [
            { label: t('nav.ledger', 'Open Shared Ledger'), onClick: () => { location.href = 'ledger.html'; }, primary: true },
            { label: t('nav.directory', 'View Directory'), onClick: () => { location.href = 'directory.html'; }, close: false }
          ]
        });
      }
    });

    /* ----------------------------------------------------------------------
       07. MOBILE & OTP LOGIN FORM (FORM 2)
       ---------------------------------------------------------------------- */
    const mobileStep1 = document.getElementById('mobileStep1');
    const mobileStep2 = document.getElementById('mobileStep2');
    const phoneInput = document.getElementById('loginPhone');
    const btnSendOtp = document.getElementById('btnSendOtp');
    const targetPhoneSpan = document.getElementById('otpTargetPhone');
    const btnChangePhone = document.getElementById('btnChangePhone');
    const btnResendOtp = document.getElementById('btnResendOtp');
    const resendCountdown = document.getElementById('resendCountdown');
    const otpInputs = Array.from(document.querySelectorAll('.otp-digit-input'));
    const hiddenOtpInput = document.getElementById('hiddenOtpValue');

    let currentPhone = '';
    let countdownTimer = null;

    // Digits only on phone input
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      });
    }

    // Step 1: Send OTP
    if (btnSendOtp && phoneInput) {
      btnSendOtp.addEventListener('click', async () => {
        const phoneVal = phoneInput.value.trim();
        const err = V.validateField(V.SCHEMAS.loginMobile, 'phone', phoneVal);

        const fieldBox = phoneInput.closest('.field');
        const errBox = fieldBox.querySelector('.field-error');

        if (err) {
          phoneInput.classList.add('is-invalid');
          if (errBox) errBox.textContent = I.msg(err);
          phoneInput.focus();
          return;
        }

        phoneInput.classList.remove('is-invalid');
        phoneInput.classList.add('is-valid');
        if (errBox) errBox.textContent = '';

        btnSendOtp.disabled = true;
        btnSendOtp.classList.add('is-busy');

        await new Promise((r) => setTimeout(r, 600));

        btnSendOtp.disabled = false;
        btnSendOtp.classList.remove('is-busy');

        currentPhone = phoneVal;
        if (targetPhoneSpan) {
          targetPhoneSpan.textContent = `+91 ${phoneVal.slice(0, 5)} ${phoneVal.slice(5)}`;
        }

        // Transition to Step 2 (OTP Entry)
        mobileStep1.style.display = 'none';
        mobileStep2.style.display = 'flex';
        hiddenOtpInput.value = '';
        otpInputs.forEach((inp) => (inp.value = ''));
        if (otpInputs[0]) otpInputs[0].focus();

        UI.toast(fmt('login.otpSent', { phone: `+91 ${phoneVal}` }, `Verification code sent to +91 ${phoneVal}. (Demo: Any 6 digits work)`));

        startCountdown();
      });
    }

    // Step 2: Change Phone Number
    if (btnChangePhone) {
      btnChangePhone.addEventListener('click', () => {
        clearInterval(countdownTimer);
        mobileStep2.style.display = 'none';
        mobileStep1.style.display = 'flex';
        phoneInput.focus();
      });
    }

    function startCountdown() {
      clearInterval(countdownTimer);
      let seconds = 30;
      btnResendOtp.disabled = true;
      resendCountdown.textContent = `(${seconds}s)`;

      countdownTimer = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(countdownTimer);
          btnResendOtp.disabled = false;
          resendCountdown.textContent = '';
        } else {
          resendCountdown.textContent = `(${seconds}s)`;
        }
      }, 1000);
    }

    if (btnResendOtp) {
      btnResendOtp.addEventListener('click', () => {
        UI.toast(fmt('login.otpSent', { phone: `+91 ${currentPhone}` }, `New verification code sent to +91 ${currentPhone}.`));
        startCountdown();
      });
    }

    // 6-digit OTP Box Navigation & Paste Handling
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val[val.length - 1] : '';

        // Update hidden aggregated input
        const aggregated = otpInputs.map((i) => i.value).join('');
        hiddenOtpInput.value = aggregated;

        // Auto-advance
        if (e.target.value && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        pasted.split('').forEach((char, i) => {
          if (otpInputs[i]) otpInputs[i].value = char;
        });

        hiddenOtpInput.value = pasted;
        const nextIdx = Math.min(pasted.length, otpInputs.length - 1);
        if (otpInputs[nextIdx]) otpInputs[nextIdx].focus();
      });
    });

    // Mobile Form Submission
    mobileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otpVal = hiddenOtpInput.value.trim();
      const errBox = document.getElementById('otpFieldError');

      if (otpVal.length < 4 || otpVal.length > 6) {
        if (errBox) errBox.textContent = t('v.otp', 'Please enter a valid 4-to-6 digit code.');
        otpInputs.forEach((i) => i.classList.add('is-invalid'));
        const firstEmpty = otpInputs.find((i) => !i.value) || otpInputs[0];
        if (firstEmpty) firstEmpty.focus();
        return;
      }

      if (errBox) errBox.textContent = '';
      otpInputs.forEach((i) => i.classList.remove('is-invalid'));

      const submitBtn = mobileForm.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-busy');
      }

      try {
        const res = await window.SKStore.create('logins', {
          method: 'mobile',
          phone: currentPhone,
          otp: otpVal,
          step: 'otp'
        });

        sessionStorage.setItem('sk_user_session', JSON.stringify({
          id: res.record.id,
          type: 'mobile',
          identifier: res.record.identifier,
          role: res.record.role,
          name: res.record.name,
          signedInAt: res.record.createdAt,
          via: res.via
        }));

        UI.toast(t('login.success', 'Signed in successfully. Welcome to SevaKhata.'), 'success');

        UI.successModal({
          title: t('login.title', 'Enter the Ledger'),
          lines: [
            fmt('login.welcomeMsg', { user: res.record.name || `+91 ${currentPhone}` }, 'Mobile authentication verified for {user}.'),
            'Your mutual ledger records and pending settlements are synchronized.'
          ],
          reference: res.record.id,
          via: res.via,
          actions: [
            { label: t('nav.ledger', 'Open Shared Ledger'), onClick: () => { location.href = 'ledger.html'; }, primary: true },
            { label: t('nav.directory', 'View Directory'), onClick: () => { location.href = 'directory.html'; }, close: false }
          ]
        });
      } catch (err) {
        UI.toast((err && err.message) || 'Authentication failed', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-busy');
        }
      }
    });
  });
})();
