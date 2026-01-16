<script lang="ts">
  interface Props {
    whites: { [key: string]: boolean | number; stars: number };
    availableWhites: string[] | (() => string[]);
  }

  let { whites, availableWhites }: Props = $props();

  let showModal = $state(false);
  let searchWhites = $state('');

  const available = $derived(typeof availableWhites === 'function' ? availableWhites() : availableWhites);

  const filteredWhites = $derived(
    available.filter(w => w.toLowerCase().includes(searchWhites.toLowerCase()))
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

  function toggleSkill(skill: string) {
    whites[skill] = !whites[skill];
  }
</script>

<div>
  <button class="btn btn-outline-secondary btn-sm mb-2" onclick={openModal}>
    Select Skills ({selectedCount} selected)
  </button>
  <label class="form-label">Min Stars:</label>
  <div class="btn-group" role="group">
    <button type="button" class="btn {whites.stars === 1 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm" onclick={() => whites.stars = 1}>1</button>
    <button type="button" class="btn {whites.stars === 2 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm" onclick={() => whites.stars = 2}>2</button>
    <button type="button" class="btn {whites.stars === 3 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm" onclick={() => whites.stars = 3}>3</button>
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
            <div class="d-flex flex-wrap gap-2">
              {#each filteredWhites as white}
                <button
                  class="btn {whites[white] ? 'btn-warning' : 'btn-outline-secondary'}"
                  onclick={() => toggleSkill(white)}
                >
                  {white}
                </button>
              {/each}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={closeModal}>Close</button>
        </div>
      </div>
    </div>
  </div>
{/if}