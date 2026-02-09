<script lang="ts">
    interface FilterItem {
        id: string;
        stat: string;
        min: number;
        max: number;
    }

    interface Props {
        filters: {
            blues: FilterItem[];
            reds: FilterItem[];
            totalBlues: { min: number; max: number };
            totalReds: { min: number; max: number };
            greens: { stars: number };
            whites: { [key: string]: number };
            whitesIncludeParents: boolean;
        };
        availableWhites: string[] | (() => string[]);
    }

    import SkillFilter from "./SkillFilter.svelte";
    import FilterRow from "./FilterRow.svelte";

    let { filters, availableWhites }: Props = $props();

    let showModal = $state(false);
    let lineageMode = $state(false);

    // Simple mode selections
    let simpleBlues = $state({
        speed: false,
        stamina: false,
        power: false,
        guts: false,
        wit: false,
        stars: 1,
    });

    let simpleReds = $state({
        turf: false,
        dirt: false,
        frontRunner: false,
        paceChaser: false,
        lateSurger: false,
        endCloser: false,
        sprint: false,
        mile: false,
        medium: false,
        long: false,
        stars: 1,
    });

    const blueStats = ["Speed", "Stamina", "Power", "Guts", "Wit"];
    const redStats = [
        "Turf",
        "Dirt",
        "Front Runner",
        "Pace Chaser",
        "Late Surger",
        "End Closer",
        "Sprint",
        "Mile",
        "Medium",
        "Long",
    ];

    const availableBlueStats = $derived(() => {
        const selected = new Set(filters.blues.map((f) => f.stat));
        return blueStats.filter((s) => !selected.has(s));
    });

    const availableRedStats = $derived(() => {
        const selected = new Set(filters.reds.map((f) => f.stat));
        return redStats.filter((s) => !selected.has(s));
    });

    function openModal() {
        showModal = true;
    }

    function closeModal() {
        showModal = false;
    }

    function addBlueFilter() {
        const available = availableBlueStats();
        if (available.length > 0) {
            filters.blues.push({
                id: crypto.randomUUID(),
                stat: available[0],
                min: 0,
                max: 9,
            });
        }
    }

    function addRedFilter() {
        const available = availableRedStats();
        if (available.length > 0) {
            filters.reds.push({
                id: crypto.randomUUID(),
                stat: available[0],
                min: 0,
                max: 9,
            });
        }
    }

    function removeBlueFilter(id: string) {
        filters.blues = filters.blues.filter((f) => f.id !== id);
    }

    function removeRedFilter(id: string) {
        filters.reds = filters.reds.filter((f) => f.id !== id);
    }

    function updateBlueStat(id: string, stat: string) {
        const filter = filters.blues.find((f) => f.id === id);
        if (filter) filter.stat = stat;
    }

    function updateRedStat(id: string, stat: string) {
        const filter = filters.reds.find((f) => f.id === id);
        if (filter) filter.stat = stat;
    }

    function updateBlueMin(id: string, value: number) {
        const filter = filters.blues.find((f) => f.id === id);
        if (filter) filter.min = value;
    }

    function updateBlueMax(id: string, value: number) {
        const filter = filters.blues.find((f) => f.id === id);
        if (filter) filter.max = value;
    }

    function updateRedMin(id: string, value: number) {
        const filter = filters.reds.find((f) => f.id === id);
        if (filter) filter.min = value;
    }

    function updateRedMax(id: string, value: number) {
        const filter = filters.reds.find((f) => f.id === id);
        if (filter) filter.max = value;
    }

    function resetFilters() {
        filters.blues = [];
        filters.reds = [];
        filters.totalBlues = { min: 0, max: 9 };
        filters.totalReds = { min: 0, max: 9 };
        filters.greens.stars = 0;

        const whiteKeys = Object.keys(filters.whites);
        whiteKeys.forEach((k) => {
            filters.whites[k] = 0;
        });
        filters.whitesIncludeParents = false;

        simpleBlues = {
            speed: false,
            stamina: false,
            power: false,
            guts: false,
            wit: false,
            stars: 1,
        };
        simpleReds = {
            turf: false,
            dirt: false,
            frontRunner: false,
            paceChaser: false,
            lateSurger: false,
            endCloser: false,
            sprint: false,
            mile: false,
            medium: false,
            long: false,
            stars: 1,
        };

        lineageMode = false;
    }
</script>

<button class="btn dropdown-toggle" type="button" onclick={openModal}>
    Filters
</button>

{#if showModal}
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
                    <!-- Lineage Mode Toggle at Top -->
                    <div class="mb-3 pb-3 border-bottom">
                        <div class="form-check form-switch">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                id="lineageModeToggle"
                                bind:checked={lineageMode}
                            />
                            <label
                                class="form-check-label"
                                for="lineageModeToggle"
                            >
                                <strong>Lineage Mode</strong>
                                <small class="text-muted d-block"
                                    >Filter by combined stars from unit +
                                    parents</small
                                >
                            </label>
                        </div>
                    </div>

                    {#if lineageMode}
                        <!-- Lineage Mode: Blues/Reds on top row (more width) -->
                        <div class="row g-3 mb-3">
                            <!-- Blues Column -->
                            <div class="col-md-6">
                                <div class="filter-section">
                                    <h6 class="mb-2">Blues (Stats)</h6>

                                    <!-- Total Blues Slider -->
                                    <div class="total-filter mb-3">
                                        <label class="form-label text-muted mb-1" style="font-size: 0.875rem;">Total Blues (All Stats Combined)</label>
                                        <FilterRow
                                            filterType="blues"
                                            selectedStat="Total"
                                            minValue={filters.totalBlues.min}
                                            maxValue={filters.totalBlues.max}
                                            availableStats={["Total"]}
                                            onStatChange={() => {}}
                                            onMinChange={(v) => (filters.totalBlues.min = v)}
                                            onMaxChange={(v) => (filters.totalBlues.max = v)}
                                            onRemove={() => {
                                                filters.totalBlues.min = 0;
                                                filters.totalBlues.max = 9;
                                            }}
                                        />
                                    </div>

                                    <!-- Advanced Blues (Lineage Mode) -->
                                    <div class="filters-list">
                                        {#each filters.blues as filter (filter.id)}
                                            <FilterRow
                                                filterType="blues"
                                                selectedStat={filter.stat}
                                                minValue={filter.min}
                                                maxValue={filter.max}
                                                availableStats={[
                                                    filter.stat,
                                                    ...availableBlueStats(),
                                                ]}
                                                onStatChange={(stat) =>
                                                    updateBlueStat(
                                                        filter.id,
                                                        stat,
                                                    )}
                                                onMinChange={(v) =>
                                                    updateBlueMin(filter.id, v)}
                                                onMaxChange={(v) =>
                                                    updateBlueMax(filter.id, v)}
                                                onRemove={() =>
                                                    removeBlueFilter(filter.id)}
                                            />
                                        {/each}
                                    </div>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-primary w-100"
                                        onclick={addBlueFilter}
                                        disabled={availableBlueStats()
                                            .length === 0}
                                    >
                                        + Add Blue Factor
                                    </button>
                                </div>
                            </div>

                            <!-- Reds Column -->
                            <div class="col-md-6">
                                <div class="filter-section">
                                    <h6 class="mb-2">Reds (Aptitudes)</h6>

                                    <!-- Total Reds Slider -->
                                    <div class="total-filter mb-3">
                                        <label class="form-label text-muted mb-1" style="font-size: 0.875rem;">Total Reds (Unit + Parents)</label>
                                        <FilterRow
                                            filterType="reds"
                                            selectedStat="Total"
                                            minValue={filters.totalReds.min}
                                            maxValue={filters.totalReds.max}
                                            availableStats={["Total"]}
                                            onStatChange={() => {}}
                                            onMinChange={(v) => (filters.totalReds.min = v)}
                                            onMaxChange={(v) => (filters.totalReds.max = v)}
                                            onRemove={() => {
                                                filters.totalReds.min = 0;
                                                filters.totalReds.max = 9;
                                            }}
                                        />
                                    </div>

                                    <!-- Advanced Reds (Lineage Mode) -->
                                    <div class="filters-list">
                                        {#each filters.reds as filter (filter.id)}
                                            <FilterRow
                                                filterType="reds"
                                                selectedStat={filter.stat}
                                                minValue={filter.min}
                                                maxValue={filter.max}
                                                availableStats={[
                                                    filter.stat,
                                                    ...availableRedStats(),
                                                ]}
                                                onStatChange={(stat) =>
                                                    updateRedStat(
                                                        filter.id,
                                                        stat,
                                                    )}
                                                onMinChange={(v) =>
                                                    updateRedMin(filter.id, v)}
                                                onMaxChange={(v) =>
                                                    updateRedMax(filter.id, v)}
                                                onRemove={() =>
                                                    removeRedFilter(filter.id)}
                                            />
                                        {/each}
                                    </div>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-danger w-100"
                                        onclick={addRedFilter}
                                        disabled={availableRedStats().length ===
                                            0}
                                    >
                                        + Add Red Factor
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Greens/Whites Row (below Blues/Reds in lineage mode) -->
                        <div class="row g-3">
                            <!-- Greens Column -->
                            <div class="col-md-6">
                                <div class="filter-section">
                                    <h6 class="mb-2">Greens</h6>
                                    <label class="form-label">Min Stars:</label>
                                    <div class="btn-group" role="group">
                                        <button
                                            type="button"
                                            class="btn {filters.greens.stars ===
                                            1
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (filters.greens.stars = 1)}
                                            >1</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {filters.greens.stars ===
                                            2
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (filters.greens.stars = 2)}
                                            >2</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {filters.greens.stars ===
                                            3
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (filters.greens.stars = 3)}
                                            >3</button
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Whites Column -->
                            <div class="col-md-6">
                                <div class="filter-section">
                                    <h6 class="mb-2">Whites (Skills)</h6>
                                    <div class="form-check mb-2">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="whitesIncludeParents"
                                            bind:checked={
                                                filters.whitesIncludeParents
                                            }
                                        />
                                        <label
                                            class="form-check-label"
                                            for="whitesIncludeParents"
                                        >
                                            <small>Include Parents</small>
                                        </label>
                                    </div>
                                    <SkillFilter
                                        whites={filters.whites}
                                        {availableWhites}
                                        includeParents={filters.whitesIncludeParents}
                                    />
                                </div>
                            </div>
                        </div>
                    {:else}
                        <!-- Simple Mode: All 4 columns in one row -->
                        <div class="row g-3">
                            <!-- Blues Column -->
                            <div class="col-md-3">
                                <div class="filter-section">
                                    <h6 class="mb-2">Blues (Stats)</h6>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="blueSpeed2"
                                            bind:checked={simpleBlues.speed}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="blueSpeed2">Speed</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="blueStamina2"
                                            bind:checked={simpleBlues.stamina}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="blueStamina2">Stamina</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="bluePower2"
                                            bind:checked={simpleBlues.power}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="bluePower2">Power</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="blueGuts2"
                                            bind:checked={simpleBlues.guts}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="blueGuts2">Guts</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="blueWit2"
                                            bind:checked={simpleBlues.wit}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="blueWit2">Wit</label
                                        >
                                    </div>
                                    <br />
                                    <label class="form-label">Min Stars:</label>
                                    <div class="btn-group" role="group">
                                        <button
                                            type="button"
                                            class="btn {simpleBlues.stars === 1
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (simpleBlues.stars = 1)}
                                            >1</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {simpleBlues.stars === 2
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (simpleBlues.stars = 2)}
                                            >2</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {simpleBlues.stars === 3
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (simpleBlues.stars = 3)}
                                            >3</button
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Reds Column -->
                            <div class="col-md-3">
                                <div class="filter-section">
                                    <h6 class="mb-2">Reds (Aptitudes)</h6>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redTurf2"
                                            bind:checked={simpleReds.turf}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redTurf2">Turf</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redDirt2"
                                            bind:checked={simpleReds.dirt}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redDirt2">Dirt</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redFrontRunner2"
                                            bind:checked={
                                                simpleReds.frontRunner
                                            }
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redFrontRunner2"
                                            >Front Runner</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redPaceChaser2"
                                            bind:checked={simpleReds.paceChaser}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redPaceChaser2"
                                            >Pace Chaser</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redLateSurger2"
                                            bind:checked={simpleReds.lateSurger}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redLateSurger2"
                                            >Late Surger</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redEndCloser2"
                                            bind:checked={simpleReds.endCloser}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redEndCloser2"
                                            >End Closer</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redSprint2"
                                            bind:checked={simpleReds.sprint}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redSprint2">Sprint</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redMile2"
                                            bind:checked={simpleReds.mile}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redMile2">Mile</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redMedium2"
                                            bind:checked={simpleReds.medium}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redMedium2">Medium</label
                                        >
                                    </div>
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="redLong2"
                                            bind:checked={simpleReds.long}
                                        />
                                        <label
                                            class="form-check-label"
                                            for="redLong2">Long</label
                                        >
                                    </div>
                                    <br />
                                    <label class="form-label">Min Stars:</label>
                                    <div class="btn-group" role="group">
                                        <button
                                            type="button"
                                            class="btn {simpleReds.stars === 1
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (simpleReds.stars = 1)}
                                            >1</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {simpleReds.stars === 2
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (simpleReds.stars = 2)}
                                            >2</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {simpleReds.stars === 3
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (simpleReds.stars = 3)}
                                            >3</button
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Greens Column -->
                            <div class="col-md-3">
                                <div class="filter-section">
                                    <h6 class="mb-2">Greens</h6>
                                    <label class="form-label">Min Stars:</label>
                                    <div class="btn-group" role="group">
                                        <button
                                            type="button"
                                            class="btn {filters.greens.stars ===
                                            1
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (filters.greens.stars = 1)}
                                            >1</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {filters.greens.stars ===
                                            2
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (filters.greens.stars = 2)}
                                            >2</button
                                        >
                                        <button
                                            type="button"
                                            class="btn {filters.greens.stars ===
                                            3
                                                ? 'btn-primary'
                                                : 'btn-outline-secondary'} btn-sm"
                                            onclick={() =>
                                                (filters.greens.stars = 3)}
                                            >3</button
                                        >
                                    </div>
                                </div>
                            </div>

                            <!-- Whites Column -->
                            <div class="col-md-3">
                                <div class="filter-section">
                                    <h6 class="mb-2">Whites (Skills)</h6>
                                    <div class="form-check mb-2">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="whitesIncludeParents2"
                                            bind:checked={
                                                filters.whitesIncludeParents
                                            }
                                        />
                                        <label
                                            class="form-check-label"
                                            for="whitesIncludeParents2"
                                        >
                                            <small>Include Parents</small>
                                        </label>
                                    </div>
                                    <SkillFilter
                                        whites={filters.whites}
                                        {availableWhites}
                                        includeParents={filters.whitesIncludeParents}
                                    />
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
                <div class="modal-footer">
                    <button
                        type="button"
                        class="btn btn-outline-danger me-auto"
                        onclick={resetFilters}>Reset Filters</button
                    >
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

<style>
    .filter-section {
        padding: 0.75rem;
        height: 100%;
        min-height: 200px;
    }

    .filters-list {
        min-height: 50px;
        max-height: 350px;
        overflow-y: auto;
        overflow-x: hidden;
        margin-bottom: 0.5rem;
        padding: 0 0.5rem;
    }

    .filters-list::-webkit-scrollbar {
        width: 6px;
    }

    .filters-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }

    .filters-list::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
    }

    .filters-list::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
</style>
