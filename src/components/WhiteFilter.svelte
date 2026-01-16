<script lang="ts">
  interface Props {
    whites: { [key: string]: boolean | number; stars: number };
    availableWhites: string[];
  }

  let { whites, availableWhites }: Props = $props();

  let showModal = $state(false);
  let searchWhites = $state('');

  const filteredWhites = $derived(
    availableWhites.filter(w => w.toLowerCase().includes(searchWhites.toLowerCase()))
  );

  const selectedCount = $derived(
    Object.entries(whites).filter(([k, v]) => k !== 'stars' && v).length
  );

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }
</script>

<div>
  <button class="btn btn-outline-secondary btn-sm mb-2" onclick={openModal}>
    Select Skills ({selectedCount} selected)
  </button>
  <label class="form-label">Min Stars:</label>
  <div class="btn-group" role="group">
    <button type="button" class="btn btn-outline-secondary btn-sm" onclick={() => whites.stars = 0}>0</button>
    <button type="button" class="btn btn-outline-secondary btn-sm" onclick={() => whites.stars = 1}>1</button>
    <button type="button" class="btn btn-outline-secondary btn-sm" onclick={() => whites.stars = 2}>2</button>
    <button type="button" class="btn btn-outline-secondary btn-sm" onclick={() => whites.stars = 3}>3</button>
  </div>
</div>

{#if showModal}
  <!-- Backdrop -->
  <div class="modal-backdrop fade show" onclick={closeModal}></div>

  <div class="modal fade show" style="display: block;" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Select Skills</h5>
          <button
            type="button"
            class="btn-close"
            onclick={closeModal}
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <input
            type="text"
            class="form-control mb-3"
            placeholder="Search skills..."
            bind:value={searchWhites}
          />
          <div style="max-height: 400px; overflow-y: auto;">
            {#each filteredWhites as white}
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id={`white${white.replace(/\s+/g, '')}`}
                  bind:checked={whites[white] as boolean}
                />
                <label class="form-check-label" for={`white${white.replace(/\s+/g, '')}`}>
                  {white}
                </label>
              </div>
            {/each}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={closeModal}>Close</button>
        </div>
      </div>
    </div>
  </div>
{/if}