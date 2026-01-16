<script lang="ts">
    import { skillsData } from "../data";
    import type { SkillData } from "../types";

    interface Props {
        skillData: SkillData;
    }
    const { skillData }: Props = $props();
    const skill = $derived(skillsData[skillData.skill_id]);
    const skillLabel = $derived(
        skill?.name || `Unknown Skill (${skillData.skill_id})`,
    );
</script>

<div class="d-flex align-items-center border border-1 rounded px-2 gap-2 p-1">
    <img src={`/skill/utx_ico_skill_${skill?.icon_id}.png`} alt={skill?.name} />
    {skillLabel}
</div>

<style>
    img {
        height: 19px;
    }
</style>
