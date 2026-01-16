<script lang="ts">
    import type { SkillData } from "../types";
    import Skill from "./Skill.svelte";

    interface Props {
        skillList: SkillData[];
    }
    const { skillList }: Props = $props();
</script>

<div class="row row-cols-auto g-1 gx-2">
    {#each skillList as skillData}
        <div class="col">
            <Skill {skillData}></Skill>
        </div>
    {/each}
</div>
