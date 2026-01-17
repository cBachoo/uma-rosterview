<script lang="ts">
    interface Props {
        whites: { [key: string]: number }; // 0 = not selected, 1-3 or 1-9 = min stars
        availableWhites: string[] | (() => string[]);
        includeParents?: boolean;
    }

    let { whites, availableWhites, includeParents = false }: Props = $props();

    let showModal = $state(false);
    let searchWhites = $state("");

    const maxStars = $derived(includeParents ? 9 : 3);

    const available = $derived(
        typeof availableWhites === "function"
            ? availableWhites()
            : availableWhites,
    );

    const filteredWhites = $derived(
        available.filter((w) =>
            w.toLowerCase().includes(searchWhites.toLowerCase()),
        ),
    );

    const selectedWhites = $derived(
        Object.entries(whites)
            .filter(([_, v]) => v > 0)
            .map(([k, v]) => ({ name: k, stars: v })),
    );

    function openModal() {
        showModal = true;
    }

    function closeModal() {
        showModal = false;
    }

    function selectSkill(skill: string, stars: number) {
        whites[skill] = stars;
        searchWhites = ""; // Clear search after selection
    }

    function removeSkill(skill: string) {
        whites[skill] = 0;
    }

    function cycleStars(skill: string) {
        const current = whites[skill] || 0;
        whites[skill] = current >= maxStars ? 1 : current + 1;
    }
</script>

<div>
    <button class="btn btn-outline-secondary btn-sm mb-2" onclick={openModal}>
        Select Skills ({selectedWhites.length} selected)
    </button>
    
    {#if selectedWhites.length > 0}
        <div class="d-flex flex-wrap gap-1 mt-1" style="max-width: 100%; overflow: hidden;">
            {#each selectedWhites as { name, stars }}
                <span class="badge bg-secondary text-white d-flex align-items-center gap-1" style="max-width: 100%; font-size: 0.7rem;">
                    <select
                        class="border-0 bg-transparent text-white flex-shrink-0"
                        style="width: 40px; font-size: 0.7rem; padding: 0; outline: none; -webkit-appearance: none; appearance: none; cursor: pointer;"
                        value={stars}
                        onchange={(e) => selectSkill(name, parseInt(e.currentTarget.value))}
                    >
                        {#each Array.from({length: maxStars}, (_, i) => i + 1) as star}
                            <option value={star} class="text-dark bg-white">{star}★</option>
                        {/each}
                    </select>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;" title={name}>{name}</span>
                    <button 
                        class="btn-close btn-close-white btn-close-sm ms-1 flex-shrink-0" 
                        style="font-size: 0.5rem;"
                        onclick={() => removeSkill(name)}
                    ></button>
                </span>
            {/each}
        </div>
    {/if}
</div>

{#if showModal}
    <!-- Backdrop -->
    <div class="modal-backdrop fade show" onclick={closeModal}></div>

    <div class="modal fade show" style="display: block;" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Select White Sparks</h5>
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
                        placeholder="Search sparks..."
                        bind:value={searchWhites}
                    />
                    <div style="max-height: 400px; overflow-y: auto;">
                        <div class="d-flex flex-wrap gap-2">
                            {#each filteredWhites as white}
                                {@const currentStars = whites[white] || 0}
                                <div class="d-flex align-items-center gap-1">
                                    <button
                                        class="btn {currentStars > 0
                                            ? 'btn-warning'
                                            : 'btn-outline-secondary'} btn-sm"
                                        onclick={() => selectSkill(white, currentStars > 0 ? 0 : 1)}
                                    >
                                        {white}
                                    </button>
                                    {#if currentStars > 0}
                                        <select
                                            class="form-select form-select-sm"
                                            style="width: auto;"
                                            value={currentStars}
                                            onchange={(e) => selectSkill(white, parseInt(e.currentTarget.value))}
                                        >
                                            {#each Array.from({length: maxStars}, (_, i) => i + 1) as star}
                                                <option value={star}>{star}★</option>
                                            {/each}
                                        </select>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        type="button"
                        class="btn btn-secondary"
                        onclick={closeModal}>Close</button
                    >
                </div>
            </div>
        </div>
    </div>
{/if}
