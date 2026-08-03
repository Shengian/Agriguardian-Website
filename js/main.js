document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav__link');
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterSuccess = document.getElementById('newsletterSuccess');
  const employeeLoginForm = document.getElementById('employeeLoginForm');
  const employerLoginForm = document.getElementById('employerLoginForm');
  const internLoginForm = document.getElementById('internLoginForm');
  const internWorkForm = document.getElementById('internWorkForm');
  const internAttendanceForm = document.getElementById('internAttendanceForm');
  const navDropdown = document.querySelector('.nav__dropdown');
  const dropdownToggle = document.querySelector('.nav__dropdown-toggle');

  // Sticky header on scroll
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // Mobile navigation toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('open');
      document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });
  }

  // Mobile dropdown toggle
  if (dropdownToggle && navDropdown) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navDropdown.classList.toggle('open');
    });
  }

  // Close mobile menu on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navToggle) navToggle.classList.remove('active');
      if (navMenu) navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');

  function updateActiveLink() {
    if (!navLinks.length) return;

    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink);

  // Animated counter for stats
  const statsNumbers = document.querySelectorAll('.stats__number');
  let statsAnimated = false;

  function animateCounters() {
    if (statsAnimated) return;

    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;

    const rect = statsSection.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    statsAnimated = true;

    statsNumbers.forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const duration = 2000;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }

      requestAnimationFrame(update);
    });
  }

  window.addEventListener('scroll', animateCounters);
  animateCounters();

  // Contact form submission
  if (contactForm && formSuccess) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const formData = {
        name: contactForm.querySelector('#name')?.value,
        email: contactForm.querySelector('#email')?.value,
        phone: contactForm.querySelector('#phone')?.value,
        subject: contactForm.querySelector('#subject')?.value,
        message: contactForm.querySelector('#message')?.value,
      };

      try {
        const response = await fetch('/api/website/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to send message');

        formSuccess.textContent = 'Thank you! Your message has been sent.';
        formSuccess.style.color = 'var(--green)';
        formSuccess.classList.add('show');
        contactForm.reset();
      } catch (err) {
        formSuccess.textContent = 'An error occurred. Please try again.';
        formSuccess.style.color = 'red';
        formSuccess.classList.add('show');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
        setTimeout(() => formSuccess.classList.remove('show'), 5000);
      }
    });
  }

  // Newsletter form
  if (newsletterForm && newsletterSuccess) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = newsletterForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput?.value;

      try {
        const response = await fetch('/api/website/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (!response.ok) throw new Error('Subscription failed');

        newsletterSuccess.textContent = 'Subscribed successfully!';
        newsletterSuccess.style.color = 'var(--green)';
        newsletterSuccess.classList.add('show');
        newsletterForm.reset();
      } catch (err) {
        newsletterSuccess.textContent = 'An error occurred or already subscribed.';
        newsletterSuccess.style.color = 'red';
        newsletterSuccess.classList.add('show');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        setTimeout(() => newsletterSuccess.classList.remove('show'), 4000);
      }
    });
  }

  // Portal login forms
  function handleLoginForm(form) {
    const successEl = form.querySelector('.form__success');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = form.querySelector('input[type="email"], input[name="email"], input[name="employeeId"], input[name="employerId"]');
      const passwordInput = form.querySelector('input[type="password"]');
      
      if (!emailInput || !passwordInput) return;
      
      const email = emailInput.value;
      const password = passwordInput.value;
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }
        
        // Success
        localStorage.setItem('ag_token', data.token);
        
        if (successEl) {
          successEl.textContent = 'Login successful! Redirecting to dashboard...';
          successEl.style.color = 'var(--green)';
          successEl.classList.add('show');
        }

        const platformRole = form.dataset.platformRole;
        if (platformRole && window.AG_SITE) {
          setTimeout(() => {
            // Check if site config defines how to get to the SPA routes directly
            // If they are on the same domain, we can just navigate to the role route
            window.location.href = `/${data.user.role}`;
          }, 700);
          return;
        }

        const redirectUrl = form.dataset.redirectUrl;
        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 700);
          return;
        }

      } catch (err) {
        if (successEl) {
          successEl.textContent = err.message;
          successEl.style.color = 'red';
          successEl.classList.add('show');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      }
    });
  }

  if (employeeLoginForm) handleLoginForm(employeeLoginForm);
  if (employerLoginForm) handleLoginForm(employerLoginForm);
  if (internLoginForm) handleLoginForm(internLoginForm);

  if (internWorkForm) {
    const submissionSuccess = document.getElementById('internWorkSuccess');
    internWorkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submissionSuccess) submissionSuccess.classList.add('show');
      internWorkForm.reset();

      setTimeout(() => {
        if (submissionSuccess) submissionSuccess.classList.remove('show');
      }, 5000);
    });
  }

  if (internAttendanceForm) {
    const attendanceSuccess = document.getElementById('internAttendanceSuccess');
    internAttendanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (attendanceSuccess) attendanceSuccess.classList.add('show');
      internAttendanceForm.reset();

      setTimeout(() => {
        if (attendanceSuccess) attendanceSuccess.classList.remove('show');
      }, 5000);
    });
  }

  document.querySelectorAll('[data-logout-target]').forEach(button => {
    button.addEventListener('click', () => {
      const dashboard = document.getElementById(button.dataset.logoutTarget);
      const loginPanel = document.getElementById(button.dataset.loginTarget);

      if (dashboard) dashboard.hidden = true;
      if (loginPanel) loginPanel.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Fade-in on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeElements = document.querySelectorAll(
    '.service-card, .mission__card, .why-us__item, .about__value, .team-card, .value-prop, .offering-card, .testimonial, .portal-card, .resources__card'
  );

  fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 80);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach(el => fadeObserver.observe(el));
});
