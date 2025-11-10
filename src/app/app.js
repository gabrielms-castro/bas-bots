document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const authSection = document.getElementById('auth-section');
  const signupSection = document.getElementById('signup-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const logoutBtn = document.getElementById('logout-button');

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const goToSignupBtn = document.getElementById('go-to-signup');
  const backToLoginBtn = document.getElementById('back-to-login');

  function show(el) {
    el.hidden = false;
    el.style.display = '';
  }
  function hide(el) {
    el.hidden = true;
    el.style.display = 'none';
  }

  function showLogin() {
    body.classList.remove('body--app');
    body.classList.add('body--auth');
    show(authSection);
    hide(signupSection);
    hide(dashboardSection);
    logoutBtn.style.display = 'none';
  }

  function showSignup() {
    body.classList.remove('body--app');
    body.classList.add('body--auth');
    hide(authSection);
    show(signupSection);
    hide(dashboardSection);
    logoutBtn.style.display = 'none';
  }

  function showDashboard() {
    body.classList.remove('body--auth');
    body.classList.add('body--app');
    hide(authSection);
    hide(signupSection);
    show(dashboardSection);
    logoutBtn.style.display = '';
  }

  // Estado inicial
  const token = localStorage.getItem('token');
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }

  // Navegação entre telas
  goToSignupBtn.addEventListener('click', () => {
    showSignup();
  });

  backToLoginBtn.addEventListener('click', () => {
    showLogin();
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    showLogin();
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await login();
  });

  // Signup
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await signup();
  });

  async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      alert('Por favor, preencha e-mail e senha.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        const msg = data?.error || `Falha ao logar (HTTP ${response.status})`;
        throw new Error(msg);
      }
      showDashboard();

      if (data?.token) {
        localStorage.setItem('token', data.token);
      } else {
        alert('Credenciais inválidas.');
      }
    } catch (err) {
      console.error(err);
      alert(`Erro: ${err.message}`);
    }
  }

  async function signup() {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!email || !password) {
      alert('Por favor, preencha e-mail e senha.');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg =
          data?.error || `Falha ao criar usuário (HTTP ${response.status})`;
        throw new Error(msg);
      }

      alert('Usuário criado com sucesso!');
      // Opcional: já logar o usuário ou voltar para a tela de login
      showLogin();
      // Preenchimento automático do email recém-cadastrado
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = '';
    } catch (err) {
      console.error(err);
      alert(`Erro: ${err.message}`);
    }
  }
});
