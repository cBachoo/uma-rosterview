<script lang="ts">
    import { charaCardsData } from "../data";
    import type { SuccessionCharaData } from "../types";
    import FactorList from "./FactorList.svelte";

    interface Props {
        successionCharaData: SuccessionCharaData;
        trainedCharaID: number;
    }
    const { successionCharaData, trainedCharaID }: Props = $props();

    const charaCard = $derived(charaCardsData[successionCharaData.card_id]);
    const successionCharaLabel = $derived(
        charaCard?.name || `Unknown Chara (${successionCharaData.card_id})`,
    );
    const succesionCharaID = $derived(
        `${trainedCharaID}-${successionCharaData.position_id}`,
    );
</script>

<div class="accordion-item">
    <h2 class="accordion-header">
        <button
            class="accordion-button collapsed py-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target={`#${succesionCharaID}`}
            aria-expanded="false"
        >
            <small>{successionCharaLabel}</small>
        </button>
    </h2>
    <div
        id={`${succesionCharaID}`}
        class="accordion-collapse collapse"
        data-bs-parent={`#${succesionCharaID}`}
    >
        <div class="accordion-body p-2">
            <FactorList factorIds={successionCharaData.factor_id_array}
            ></FactorList>
        </div>
    </div>
</div>
