<script lang="ts">
    interface Props {
        filterType: "blues" | "reds";
        selectedStat: string;
        minValue: number;
        maxValue: number;
        availableStats: string[];
        onStatChange: (stat: string) => void;
        onMinChange: (value: number) => void;
        onMaxChange: (value: number) => void;
        onRemove: () => void;
    }

    let {
        filterType,
        selectedStat,
        minValue,
        maxValue,
        availableStats,
        onStatChange,
        onMinChange,
        onMaxChange,
        onRemove,
    }: Props = $props();

    // All filters use 0-9 range
    const min = 0;
    const max = 9;

    const ticks = Array.from({ length: max - min + 1 }, (_, i) => i + min);

    function handleMinChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const newMin = parseInt(target.value);
        // Allow min to equal max (for exact value filtering)
        if (newMin <= maxValue) {
            onMinChange(newMin);
        } else {
            target.value = maxValue.toString();
            onMinChange(maxValue);
        }
    }

    function handleMaxChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const newMax = parseInt(target.value);
        // Allow max to equal min (for exact value filtering)
        if (newMax >= minValue) {
            onMaxChange(newMax);
        } else {
            target.value = minValue.toString();
            onMaxChange(minValue);
        }
    }
</script>

<div
    class="factor-row-item {filterType === 'blues'
        ? 'blue-factor'
        : 'red-factor'}"
>
    <div class="row-top">
        {#if selectedStat === "Total"}
            <div class="total-label">{selectedStat}</div>
        {:else}
            <select
                class="form-select form-select-sm factor-select"
                value={selectedStat}
                onchange={(e) =>
                    onStatChange((e.target as HTMLSelectElement).value)}
            >
                {#each availableStats as stat}
                    <option value={stat}>{stat}</option>
                {/each}
            </select>
        {/if}
        <button
            type="button"
            class="btn btn-sm btn-danger remove-btn"
            onclick={onRemove}
            title={selectedStat === "Total"
                ? "Reset to max range"
                : "Remove filter"}
        >
            {selectedStat === "Total" ? "↺" : "✕"}
        </button>
    </div>
    <div class="row-bottom">
        <div class="dual-range">
            <input
                type="range"
                class="range-slider range-min"
                {min}
                {max}
                value={minValue}
                oninput={handleMinChange}
            />
            <input
                type="range"
                class="range-slider range-max"
                {min}
                {max}
                value={maxValue}
                oninput={handleMaxChange}
            />
            <div class="track-bg"></div>
            <div
                class="track-active"
                style="left: {((minValue - min) / (max - min)) *
                    100}%; width: {((maxValue - minValue) / (max - min)) *
                    100}%;"
            ></div>
        </div>
        <div class="slider-labels-row">
            {#each ticks as tick}
                <span class:active={tick >= minValue && tick <= maxValue}
                    >{tick}★</span
                >
            {/each}
        </div>
    </div>
</div>

<style>
    .factor-row-item {
        margin-bottom: 0.5rem;
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
    }

    .blue-factor {
        border-left: 3px solid #0d6efd;
    }

    .red-factor {
        border-left: 3px solid #dc3545;
    }

    .row-top {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
        align-items: center;
    }

    .factor-select {
        flex: 1;
        min-width: 0;
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
    }

    .total-label {
        flex: 1;
        min-width: 0;
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        font-weight: 600;
        color: #495057;
        display: flex;
        align-items: center;
    }

    .remove-btn {
        width: 28px;
        height: 28px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1rem;
        line-height: 1;
    }

    .row-bottom {
        position: relative;
    }

    .dual-range {
        position: relative;
        height: 40px;
        margin-bottom: 0.25rem;
        width: 100%;
    }

    .dual-range .range-slider {
        position: absolute;
        width: 100%;
        height: 40px;
        top: 0;
        left: 0;
        margin: 0;
        padding: 0;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background: transparent;
        pointer-events: none;
        outline: none;
        z-index: 10;
    }

    .dual-range .range-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #0d6efd;
        cursor: pointer;
        pointer-events: all;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        position: relative;
        margin-top: -8px;
    }

    .dual-range .range-slider::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px;
        background: transparent;
    }

    .dual-range .range-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #0d6efd;
        cursor: pointer;
        pointer-events: all;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    .dual-range .range-slider::-moz-range-track {
        width: 100%;
        height: 4px;
        background: transparent;
    }

    .dual-range .range-min::-webkit-slider-thumb {
        background: #198754;
    }

    .dual-range .range-min::-moz-range-thumb {
        background: #198754;
    }

    .track-bg {
        position: absolute;
        top: 18px;
        left: 0;
        width: 100%;
        height: 3px;
        background: #dee2e6;
        border-radius: 2px;
        z-index: 1;
    }

    .track-active {
        position: absolute;
        top: 18px;
        height: 3px;
        background: #0d6efd;
        border-radius: 2px;
        z-index: 2;
        transition:
            left 0.1s,
            width 0.1s;
    }

    .slider-labels-row {
        display: flex;
        justify-content: space-between;
        margin-top: 0.25rem;
        font-size: 0.65rem;
    }

    .slider-labels-row span {
        color: #6c757d;
        user-select: none;
        text-align: center;
        line-height: 1;
        flex-shrink: 0;
    }

    .slider-labels-row span.active {
        color: #0d6efd;
        font-weight: 600;
    }
</style>
