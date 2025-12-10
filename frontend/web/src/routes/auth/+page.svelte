<svelte:head>
	<title>Ascendant | Авторизация</title>
</svelte:head>

<main class="auth">
	<section class="card">
		<p class="eyebrow">Auth</p>
		<h1>Вход в систему</h1>
		<p class="lead">Базовая заглушка формы авторизации. Подключите реальные обработчики, когда появится API.</p>

		<form class="form" method="post" action="/auth">
			<label>
				<span>Email</span>
				<input name="email" type="email" placeholder="you@example.com" autocomplete="email" required />
			</label>
			<label>
				<span>Пароль</span>
				<input name="password" type="password" placeholder="••••••••" autocomplete="current-password" required />
			</label>
			<button type="submit">Войти</button>
		</form>

		<p class="hint">
			Нет учетной записи? <a href="/signup">Создать</a>
		</p>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #0f172a;
		color: #e2e8f0;
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.auth {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 32px 16px;
	}

	.card {
		width: min(420px, 100%);
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
		border: 1px solid rgba(226, 232, 240, 0.16);
		border-radius: 18px;
		padding: 28px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
		display: grid;
		gap: 12px;
		backdrop-filter: blur(4px);
	}

	.eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
		color: #38bdf8;
	}

	h1 {
		margin: 0;
		font-size: 26px;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: 0;
		color: #cbd5e1;
		line-height: 1.5;
	}

	.form {
		display: grid;
		gap: 12px;
		margin-top: 8px;
	}

	label {
		display: grid;
		gap: 6px;
		font-weight: 600;
		color: #e2e8f0;
	}

	input {
		width: 100%;
		padding: 12px 12px;
		border-radius: 10px;
		border: 1px solid rgba(226, 232, 240, 0.35);
		background: rgba(15, 23, 42, 0.4);
		color: #e2e8f0;
		font-size: 15px;
		transition: border-color 120ms ease, box-shadow 120ms ease;
	}

	input:focus {
		outline: none;
		border-color: #38bdf8;
		box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
	}

	button {
		margin-top: 8px;
		padding: 12px 14px;
		border: none;
		border-radius: 12px;
		font-weight: 700;
		font-size: 15px;
		cursor: pointer;
		background: linear-gradient(120deg, #22d3ee, #6366f1);
		color: #0b1224;
		transition: transform 150ms ease, box-shadow 150ms ease;
		box-shadow: 0 14px 40px rgba(99, 102, 241, 0.35);
	}

	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 18px 44px rgba(99, 102, 241, 0.4);
	}

	.hint {
		margin: 0;
		color: #cbd5e1;
	}

	.hint a {
		color: #38bdf8;
		text-decoration: none;
		font-weight: 700;
	}

	.hint a:hover {
		text-decoration: underline;
	}
</style>
