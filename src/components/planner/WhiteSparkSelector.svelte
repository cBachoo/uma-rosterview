<script lang="ts">
    import { skillsData, charaCardsData } from "../../data";

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
        Object.values(charaCardsData).map(card => card.name)
    );

    // Get full skill list from skillsData, excluding character names, sorted alphabetically
    const allSkills = Object.values(skillsData)
        .map(skill => skill.skillName)
        .filter((name): name is string =>
            name !== undefined &&
            name.trim() !== '' &&
            !characterNames.has(name)
        )
        .sort((a, b) => a.localeCompare(b));

    const starLevels = [1, 2, 3];

    let selectedSkill = $state('');
    let selectedLevel = $state(1);
    let searchTerm = $state('');
    let editingSparks = $state<SparkData[]>([...whiteSpark]);

    const filteredSkills = $derived.by(() => {
        if (!searchTerm) return allSkills;
        return allSkills.filter(skill =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    function addSpark() {
        if (!selectedSkill) return;

        const newSpark: SparkData = { stat: selectedSkill, level: selectedLevel };
        editingSparks = [...editingSparks, newSpark];
        selectedSkill = '';
        selectedLevel = 1;
        searchTerm = '';
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
<div class="modal-dialog-md">
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h6 class="modal-title">White Sparks - Skills ({editingSparks.length} selected)</h6>
            <button type="button" class="btn-close" onclick={onClose}></button>
        </div>

        <div class="modal-body p-2">
            <!-- Selected sparks list -->
            {#if editingSparks.length > 0}
                <div class="mb-2">
                    <small class="text-muted text-uppercase fw-bold d-block mb-1">Selected Skills</small>
                    <div class="selected-sparks">
                        {#each editingSparks as spark, idx}
                            <div class="d-flex align-items-center justify-content-between mb-1 p-1 border rounded">
                                <small>
                                    {spark.stat} {'★'.repeat(spark.level)}
                                </small>
                                <button
                                    class="btn btn-sm btn-link text-danger p-0"
                                    onclick={() => removeSpark(idx)}
                                    style="font-size: 1rem; line-height: 1;"
                                >
                                    ×
                                </button>
                            </div>
                        {/each}
                    </div>
                    <hr class="my-2" />
                </div>
            {/if}

            <!-- Add new spark -->
            <div class="mb-2">
                <small class="text-muted text-uppercase fw-bold d-block mb-1">Add Skill</small>
                <input
                    type="text"
                    class="form-control form-control-sm mb-2"
                    placeholder="Search skills..."
                    bind:value={searchTerm}
                />
                <select class="form-select form-select-sm mb-2" bind:value={selectedSkill}>
                    <option value="">Select skill...</option>
                    {#each filteredSkills as skill}
                        <option value={skill}>{skill}</option>
                    {/each}
                </select>
                <div class="d-flex gap-1 mb-2">
                    {#each starLevels as level}
                        <button
                            class="btn btn-sm flex-fill {selectedLevel === level ? 'btn-warning' : 'btn-outline-warning'}"
                            onclick={() => selectedLevel = level}
                        >
                            <small>{'★'.repeat(level)}</small>
                        </button>
                    {/each}
                </div>
                <button
                    class="btn btn-sm btn-success w-100"
                    onclick={addSpark}
                    disabled={!selectedSkill}
                >
                    <small>Add Skill</small>
                </button>
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

    .modal-dialog-md {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1050;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-content {
        background: var(--bs-body-bg);
        border: 1px solid var(--bs-border-color);
        border-radius: 0.5rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.5);
    }

    .modal-header {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-title {
        margin: 0;
        font-size: 0.875rem;
    }

    .modal-body {
        padding: 0.75rem;
        max-height: 60vh;
        overflow-y: auto;
    }

    .modal-footer {
        padding: 0.5rem 0.75rem;
        border-top: 1px solid var(--bs-border-color);
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
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

    .selected-sparks {
        max-height: 150px;
        overflow-y: auto;
    }
</style>
