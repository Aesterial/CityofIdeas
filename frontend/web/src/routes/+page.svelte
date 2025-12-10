<svelte:head>
	<title>Ascendant | Главная</title>
</svelte:head>

<main class="page">
	<section class="hero">
		<p class="eyebrow">Ascendant</p>
		<h1>Витрина сервисов</h1>
		<p class="lead">
			Главная точка входа: отсюда можно перейти к авторизации или открыть любой из сервисов по прямой
			ссылке.
		</p>

		<div class="actions">
			<a class="button" href="/auth">Авторизация</a>
			<a class="link" href="/docs">Перейти к сервисам</a>
		</div>
	</section>

	<section class="routes">
		<h2>Каркас маршрутов</h2>
		<ul>
			<li><code>/</code> — главная страница</li>
			<li><code>/auth</code> — страница авторизации</li>
			<li><code>/…</code> — динамический роут для остальных сервисов</li>
		</ul>
	</section>
</main>

<style>
	:global(body) {
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		color: #0f172a;
		background: radial-gradient(120% 160% at 20% 20%, #e0f2fe 0%, transparent 35%),
			radial-gradient(120% 160% at 80% 0%, #e2e8f0 0%, transparent 35%), #f8fafc;
		margin: 0;
	}

	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 96px 24px 64px;
		display: flex;
		flex-direction: column;
		gap: 48px;
	}

	.hero {
		display: grid;
		gap: 12px;
	}

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
		color: #0ea5e9;
		margin: 0;
	}

	h1 {
		font-size: clamp(32px, 6vw, 48px);
		margin: 0;
	}

	.lead {
		max-width: 640px;
		font-size: 18px;
		line-height: 1.6;
		margin: 0;
		color: #1f2937;
	}

	.actions {
		display: flex;
		gap: 12px;
		margin-top: 12px;
		flex-wrap: wrap;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 12px 18px;
		border-radius: 12px;
		background: linear-gradient(120deg, #0ea5e9, #2563eb);
		color: #f8fafc;
		text-decoration: none;
		font-weight: 700;
		box-shadow: 0 12px 30px rgba(37, 99, 235, 0.15);
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.button:hover {
		transform: translateY(-1px);
		box-shadow: 0 16px 32px rgba(37, 99, 235, 0.2);
	}

	.link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 12px 16px;
		border-radius: 12px;
		color: #0f172a;
		text-decoration: none;
		font-weight: 700;
		background: #e2e8f0;
		transition: background 150ms ease;
	}

	.link:hover {
		background: #cbd5e1;
	}

	.routes {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 16px;
		padding: 24px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
	}

	.routes h2 {
		margin: 0 0 12px;
		font-size: 20px;
	}

	.routes ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 8px;
	}

	code {
		background: #0f172a;
		color: #e0f2fe;
		border-radius: 8px;
		padding: 4px 8px;
		font-size: 14px;
	}

	@media (max-width: 640px) {
		.page {
			padding: 64px 16px 40px;
		}

		.actions {
			width: 100%;
		}

		.button,
		.link {
			flex: 1 1 auto;
			justify-content: center;
		}
	}
</style>
