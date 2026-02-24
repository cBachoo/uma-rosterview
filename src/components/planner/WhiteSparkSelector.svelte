<script lang="ts">
    import { skillsData, charaCardsData, factorsData } from "../../data";

    interface SparkData {
        stat: string;
        level: number;
    }

    interface Props {
        whiteSpark?: SparkData[];
        onClose: () => void;
        onChange: (value: SparkData[]) => void;
    }

    const { whiteSpark = [], onClose, onChange }: Props = $props();

    // Get all character names to exclude from skill list
    const characterNames = new Set(
        Object.values(charaCardsData).map((card) => card.name),
    );

    // Regular skill names from skillsData
    const regularSkillNames = Object.values(skillsData)
        .map((skill) => skill.skillName)
        .filter(
            (name): name is string =>
                name !== undefined &&
                name.trim() !== "" &&
                !characterNames.has(name),
        );

    // Race spark skill names from type 5 factors (race-won skills)
    const raceSparkNames = Array.from(
        new Set(
            Object.values(factorsData)
                .filter((f) => f.type === 5 && f.name && f.name.trim() !== "")
                .map((f) => f.name),
        ),
    );

    // Combined and sorted
    const allSkills = Array.from(
        new Set([...regularSkillNames, ...raceSparkNames]),
    ).sort((a, b) => a.localeCompare(b));

    const starLevels = [1, 2, 3];

    let selectedSkill = $state("");
    let selectedLevel = $state(1);
    let searchTerm = $state("");
    let editingSparks = $state<SparkData[]>([...whiteSpark]);

    const filteredSkills = $derived.by(() => {
        if (!searchTerm) return allSkills;
        return allSkills.filter((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    });

    function addSpark() {
        if (!selectedSkill) return;

        const newSpark: SparkData = {
            stat: selectedSkill,
            level: selectedLevel,
        };
        editingSparks = [...editingSparks, newSpark];
        selectedSkill = "";
        selectedLevel = 1;
        searchTerm = "";
    }

    function removeSpark(index: number) {
        editingSparks = editingSparks.filter((_, i) => i !== index);
    }

    function handleApply() {
        onChange(editingSparks);
        onClose();
    }

    function handleClear() {
        onChange([]);
        onClose();
    }
</script>

<div class="modal-backdrop" onclick={onClose}></div>
<div class="modal-dialog-lg">
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h6 class="modal-title">
                White Sparks — Skills ({editingSparks.length} selected)
            </h6>
            <button type="button" class="btn-close" onclick={onClose}></button>
        </div>

        <div class="modal-body p-3">
            <div class="row g-3" style="height: 65vh;">
                <!-- Left: skill picker -->
                <div class="col-7 d-flex flex-column">
                    <small
                        class="text-muted text-uppercase fw-bold d-block mb-2"
                        >Add Skill</small
                    >
                    <input
                        type="text"
                        class="form-control form-control-sm mb-2"
                        placeholder="Search skills..."
                        bind:value={searchTerm}
                        autocomplete="off"
                    />
                    <!-- Scrollable skill list -->
                    <div
                        class="skill-list mb-2"
                        style="flex: 1 1 0; min-height: 0;"
                    >
                        {#each filteredSkills as skill}
                            <button
                                type="button"
                                class="skill-item w-100 text-start px-2 py-1 border-0 rounded-1
                                    {selectedSkill === skill ? 'selected' : ''}"
                                onclick={() => (selectedSkill = skill)}
                                ondblclick={() => {
                                    selectedSkill = skill;
                                    addSpark();
                                }}
                            >
                                <small>{skill}</small>
                            </button>
                        {/each}
                        {#if filteredSkills.length === 0}
                            <div class="text-muted text-center py-3">
                                <small>No skills found</small>
                            </div>
                        {/if}
                    </div>
                    <!-- Stars + Add -->
                    <div class="d-flex gap-1 mb-2">
                        {#each starLevels as level}
                            <button
                                class="btn btn-sm flex-fill {selectedLevel ===
                                level
                                    ? 'btn-warning'
                                    : 'btn-outline-warning'}"
                                onclick={() => (selectedLevel = level)}
                            >
                                <small>{"★".repeat(level)}</small>
                            </button>
                        {/each}
                    </div>
                    <button
                        class="btn btn-sm btn-success w-100"
                        onclick={addSpark}
                        disabled={!selectedSkill}
                    >
                        <small
                            >Add {selectedSkill
                                ? `"${selectedSkill}"`
                                : "Skill"}
                            {"★".repeat(selectedLevel)}</small
                        >
                    </button>
                </div>

                <!-- Right: selected sparks -->
                <div class="col-5 d-flex flex-column">
                    <small
                        class="text-muted text-uppercase fw-bold d-block mb-2"
                    >
                        Selected ({editingSparks.length})
                    </small>
                    <div
                        class="selected-sparks"
                        style="flex: 1 1 0; min-height: 0;"
                    >
                        {#if editingSparks.length === 0}
                            <div class="text-muted text-center py-3">
                                <small>None selected</small>
                            </div>
                        {:else}
                            {#each editingSparks as spark, idx}
                                <div
                                    class="d-flex align-items-center justify-content-between mb-1 p-1 border rounded"
                                >
                                    <small class="text-truncate me-1"
                                        >{spark.stat}
                                        {"★".repeat(spark.level)}</small
                                    >
                                    <button
                                        class="btn btn-sm btn-link text-danger p-0 flex-shrink-0"
                                        onclick={() => removeSpark(idx)}
                                        style="font-size: 1rem; line-height: 1;"
                                        >×</button
                                    >
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer p-2">
            <button class="btn btn-sm btn-secondary" onclick={handleClear}>
                <small>Clear All</small>
            </button>
            <button class="btn btn-sm btn-primary" onclick={handleApply}>
                <small>Apply ({editingSparks.length})</small>
            </button>
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1040;
    }

    .modal-dialog-lg {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1050;
        width: 90%;
        max-width: 800px;
    }

    .modal-content {
        background: var(--bs-body-bg);
        border: 1px solid var(--bs-border-color);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        max-height: 90vh;
    }

    .modal-header {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }

    .modal-title {
        margin: 0;
        font-size: 0.875rem;
    }

    .modal-body {
        padding: 0.75rem;
        overflow: hidden;
        flex: 1;
    }

    .modal-footer {
        padding: 0.5rem 0.75rem;
        border-top: 1px solid var(--bs-border-color);
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        flex-shrink: 0;
    }

    .btn-close {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        font-weight: bold;
        line-height: 1;
        color: var(--bs-body-color);
        opacity: 0.5;
        cursor: pointer;
    }

    .btn-close:hover {
        opacity: 1;
    }

    .btn-close:before {
        content: "×";
    }

    /* Scrollable skill picker list */
    .skill-list {
        overflow-y: auto;
        border: 1px solid var(--bs-border-color);
        border-radius: 0.375rem;
        background: var(--bs-body-bg);
        min-height: 0;
    }

    .skill-item {
        display: block;
        background: transparent;
        color: var(--bs-body-color);
        cursor: pointer;
        border-bottom: 1px solid var(--bs-border-color) !important;
        transition: background 0.1s;
    }

    .skill-item:last-child {
        border-bottom: none !important;
    }

    .skill-item:hover {
        background: var(--bs-secondary-bg);
    }

    .skill-item.selected {
        background: var(--bs-primary);
        color: white;
    }

    /* Scrollable selected list */
    .selected-sparks {
        overflow-y: auto;
        border: 1px solid var(--bs-border-color);
        border-radius: 0.375rem;
        padding: 0.25rem;
        min-height: 0;
    }
</style>
