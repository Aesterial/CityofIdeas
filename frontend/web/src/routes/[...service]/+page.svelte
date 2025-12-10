<script lang="ts">
	export let params: { service?: string };

	const service = params.service ?? '';
	const segments = service ? service.split('/') : [];
	const label = segments.length ? `/${segments.join('/')}` : '/';
</script>

<svelte:head>
	<title>Ascendant | Сервис {label}</title>
</svelte:head>

<main class="wrap">
	<section class="card">
		<p class="eyebrow">Service placeholder</p>
		<h1>Маршрут {label}</h1>
		<p class="lead">
			Заглушка для остальных сервисов. Замените этот экран на страницу нужного приложения или подключите
			соответствующий layout.
		</p>

		<div class="meta">
			<div>
				<span class="muted">Путь</span>
				<code>{label}</code>
			</div>
			<div>
				<span class="muted">Сегменты</span>
				<span>{segments.length ? segments.join(' / ') : '—'}</span>
			</div>
		</div>

		<a class="home" href="/">На главную</a>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #0b1224;
		color: #e2e8f0;
		font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.wrap {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 48px 16px;
		background: radial-gradient(140% 160% at 20% 0%, rgba(34, 211, 238, 0.1), transparent 40%),
			radial-gradient(140% 160% at 80% 0%, rgba(99, 102, 241, 0.12), transparent 40%), #0b1224;
	}

	.card {
		width: min(560px, 100%);
		background: rgba(15, 23, 42, 0.8);
		border: 1px solid rgba(226, 232, 240, 0.1);
		border-radius: 18px;
		padding: 28px;
		box-shadow: 0 22px 70px rgba(0, 0, 0, 0.35);
		display: grid;
		gap: 12px;
		backdrop-filter: blur(6px);
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
		font-size: 28px;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: 0;
		color: #cbd5e1;
		line-height: 1.6;
	}

	.meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
		padding: 12px;
		border-radius: 12px;
		background: rgba(148, 163, 184, 0.08);
		border: 1px solid rgba(226, 232, 240, 0.08);
	}

	.meta div {
		display: grid;
		gap: 4px;
		align-content: start;
	}

	.muted {
		color: #94a3b8;
		font-weight: 600;
	}

	code {
		background: rgba(15, 23, 42, 0.9);
		color: #e0f2fe;
		padding: 8px 10px;
		border-radius: 10px;
		font-size: 15px;
		border: 1px solid rgba(226, 232, 240, 0.08);
	}

	.home {
		margin-top: 8px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 12px 16px;
		border-radius: 12px;
		background: linear-gradient(120deg, #22d3ee, #6366f1);
		color: #0b1224;
		text-decoration: none;
		font-weight: 700;
		box-shadow: 0 16px 40px rgba(99, 102, 241, 0.32);
		transition: transform 150ms ease, box-shadow 150ms ease;
	}

	.home:hover {
		transform: translateY(-1px);
		box-shadow: 0 20px 44px rgba(99, 102, 241, 0.4);
	}
</style>
