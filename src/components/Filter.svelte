<script lang="ts">
    interface Props {
        filters: {
            blues: {
                speed: boolean;
                stamina: boolean;
                power: boolean;
                guts: boolean;
                wit: boolean;
                stars: number;
            };
            reds: {
                turf: boolean;
                dirt: boolean;
                frontRunner: boolean;
                paceChaser: boolean;
                lateSurger: boolean;
                endCloser: boolean;
                sprint: boolean;
                mile: boolean;
                medium: boolean;
                long: boolean;
                stars: number;
            };
            greens: { stars: number };
            whites: { [key: string]: boolean | number; stars: number };
        };
            availableWhites: string[] | (() => string[]);
    }

  import SkillFilter from './SkillFilter.svelte';

  let { filters, availableWhites }: Props = $props();

  let showModal = $state(false);

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }
</script>

<button class="btn dropdown-toggle" type="button" onclick={openModal}>
    Filters
</button>

{#if showModal}
    <!-- Backdrop -->
    <div class="modal-backdrop fade show" onclick={closeModal}></div>

    <div class="modal fade show" style="display: block;" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Filters</h5>
                    <button
                        type="button"
                        class="btn-close"
                        onclick={closeModal}
                        aria-label="Close"
                    ></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-3">
                            <h6>Blues (Stats)</h6>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="blueSpeed"
                                    bind:checked={filters.blues.speed}
                                />
                                <label class="form-check-label" for="blueSpeed"
                                    >Speed</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="blueStamina"
                                    bind:checked={filters.blues.stamina}
                                />
                                <label
                                    class="form-check-label"
                                    for="blueStamina">Stamina</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="bluePower"
                                    bind:checked={filters.blues.power}
                                />
                                <label class="form-check-label" for="bluePower"
                                    >Power</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="blueGuts"
                                    bind:checked={filters.blues.guts}
                                />
                                <label class="form-check-label" for="blueGuts"
                                    >Guts</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="blueWit"
                                    bind:checked={filters.blues.wit}
                                />
                                <label class="form-check-label" for="blueWit"
                                    >Wit</label
                                >
                            </div>
                            <br />
                            <label class="form-label">Min Stars:</label>
                            <div class="btn-group" role="group">
                                <button
                                    type="button"
                                    class="btn {filters.blues.stars === 1 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.blues.stars = 1)}
                                    >1</button
                                >
                                <button
                                    type="button"
                                    class="btn {filters.blues.stars === 2 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.blues.stars = 2)}
                                    >2</button
                                >
                                <button
                                    type="button"
                                    class="btn {filters.blues.stars === 3 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.blues.stars = 3)}
                                    >3</button
                                >
                            </div>
                            <br />
                        </div>
                        <div class="col-md-3">
                            <h6>Reds (Aptitudes)</h6>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redTurf"
                                    bind:checked={filters.reds.turf}
                                />
                                <label class="form-check-label" for="redTurf"
                                    >Turf</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redDirt"
                                    bind:checked={filters.reds.dirt}
                                />
                                <label class="form-check-label" for="redDirt"
                                    >Dirt</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redFrontRunner"
                                    bind:checked={filters.reds.frontRunner}
                                />
                                <label
                                    class="form-check-label"
                                    for="redFrontRunner">Front Runner</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redPaceChaser"
                                    bind:checked={filters.reds.paceChaser}
                                />
                                <label
                                    class="form-check-label"
                                    for="redPaceChaser">Pace Chaser</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redLateSurger"
                                    bind:checked={filters.reds.lateSurger}
                                />
                                <label
                                    class="form-check-label"
                                    for="redLateSurger">Late Surger</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redEndCloser"
                                    bind:checked={filters.reds.endCloser}
                                />
                                <label
                                    class="form-check-label"
                                    for="redEndCloser">End Closer</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redSprint"
                                    bind:checked={filters.reds.sprint}
                                />
                                <label class="form-check-label" for="redSprint"
                                    >Sprint</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redMile"
                                    bind:checked={filters.reds.mile}
                                />
                                <label class="form-check-label" for="redMile"
                                    >Mile</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redMedium"
                                    bind:checked={filters.reds.medium}
                                />
                                <label class="form-check-label" for="redMedium"
                                    >Medium</label
                                >
                            </div>
                            <div class="form-check">
                                <input
                                    class="form-check-input"
                                    type="checkbox"
                                    id="redLong"
                                    bind:checked={filters.reds.long}
                                />
                                <label class="form-check-label" for="redLong"
                                    >Long</label
                                >
                            </div>
                            <br />
                            <label class="form-label">Min Stars:</label>
                            <div class="btn-group" role="group">
                                <button
                                    type="button"
                                    class="btn {filters.reds.stars === 1 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.reds.stars = 1)}
                                    >1</button
                                >
                                <button
                                    type="button"
                                    class="btn {filters.reds.stars === 2 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.reds.stars = 2)}
                                    >2</button
                                >
                                <button
                                    type="button"
                                    class="btn {filters.reds.stars === 3 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.reds.stars = 3)}
                                    >3</button
                                >
                            </div>
                            <br />
                        </div>
                        <div class="col-md-3">
                            <h6>Greens</h6>
                            <label class="form-label">Min Stars:</label>
                            <div class="btn-group" role="group">
                                <button
                                    type="button"
                                    class="btn {filters.greens.stars === 1 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.greens.stars = 1)}
                                    >1</button
                                >
                                <button
                                    type="button"
                                    class="btn {filters.greens.stars === 2 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.greens.stars = 2)}
                                    >2</button
                                >
                                <button
                                    type="button"
                                    class="btn {filters.greens.stars === 3 ? 'btn-primary' : 'btn-outline-secondary'} btn-sm"
                                    onclick={() => (filters.greens.stars = 3)}
                                    >3</button
                                >
                            </div>
                            <br />
                        </div>
                        <div class="col-md-3">
                            <h6>Whites (Skills)</h6>
                            <SkillFilter whites={filters.whites} {availableWhites} />
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
