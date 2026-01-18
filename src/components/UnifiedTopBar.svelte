
<script lang="ts">
  import './unified-topbar.css';

  export let currentApp: string = 'tracker';

  let isMobileMenuOpen = false;

  interface AppLink {
    id: string;
    name: string;
    url: string;
    iconType: 'guide' | 'tools' | 'tracker';
    description: string;
  }

  // Configure your apps here - update URLs as needed
  const apps: AppLink[] = [
    { id: 'guide', name: 'Guide', url: '/', iconType: 'guide', description: 'Guides & References' },
    { id: 'drafter', name: 'Drafter', url: 'https://drafter.uma.guide', iconType: 'tools', description: 'Uma Drafter' },
    { id: 'sparks', name: 'Roster Viewer', url: 'https://roster.uma.guide', iconType: 'tracker', description: 'Uma Sparks Viewer' },
  ];

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }
</script>

<div class="unified-topbar">
  <div class="topbar-inner">
    <!-- Brand -->
    <a href="https://uma.guide" class="topbar-brand">
      
      <span class="brand-text">uma.guide</span>
    </a>

    <!-- Desktop Navigation -->
    <nav class="topbar-nav desktop-only">
      {#each apps as app}
        <a
          href={app.url}
          class="nav-item"
          class:active={currentApp === app.id}
        >
          {#if app.iconType === 'guide'}
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          {:else if app.iconType === 'tools'}
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          {:else if app.iconType === 'tracker'}
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {/if}
          <span class="nav-text">{app.name}</span>
        </a>
      {/each}
    </nav>

    <!-- Right Section -->
    <div class="topbar-right">
      <!-- Mobile Menu Toggle -->
      <button
        class="mobile-menu-btn mobile-only"
        on:click={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {#if !isMobileMenuOpen}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <!-- Mobile Menu -->
  {#if isMobileMenuOpen}
    <div class="mobile-menu">
      {#each apps as app}
        <a
          href={app.url}
          class="mobile-nav-item"
          class:active={currentApp === app.id}
          on:click={closeMobileMenu}
        >
          {#if app.iconType === 'guide'}
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          {:else if app.iconType === 'tools'}
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          {:else if app.iconType === 'tracker'}
            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {/if}
          <div class="mobile-nav-content">
            <span class="nav-text">{app.name}</span>
            <span class="nav-description">{app.description}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
