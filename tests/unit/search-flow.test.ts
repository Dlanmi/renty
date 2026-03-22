import test from "node:test";
import assert from "node:assert/strict";
import {
  createSearchFlowState,
  searchFlowReducer,
} from "@/lib/domain/search-flow";
import { DEFAULT_SEARCH_FILTERS } from "@/lib/domain/search";

const BASE_FILTERS = {
  neighborhood: "Suba",
  maxPriceCOP: 800000,
  minBedrooms: 2,
};

test("reducer: open initializes draft from applied and step 1", () => {
  const initial = createSearchFlowState(BASE_FILTERS);
  const state = searchFlowReducer(initial, { type: "open_mobile_flow" });

  assert.equal(state.isMobileFlowOpen, true);
  assert.equal(state.mobileStep, 1);
  assert.deepEqual(state.draftFilters, BASE_FILTERS);
});

test("reducer: next and back should move step within bounds", () => {
  let state = searchFlowReducer(createSearchFlowState(BASE_FILTERS), {
    type: "open_mobile_flow",
  });

  state = searchFlowReducer(state, { type: "next_mobile_step" });
  state = searchFlowReducer(state, { type: "next_mobile_step" });
  state = searchFlowReducer(state, { type: "next_mobile_step" });
  assert.equal(state.mobileStep, 3);

  state = searchFlowReducer(state, { type: "prev_mobile_step" });
  state = searchFlowReducer(state, { type: "prev_mobile_step" });
  state = searchFlowReducer(state, { type: "prev_mobile_step" });
  assert.equal(state.mobileStep, 1);
});

test("reducer: apply copies draft to applied and closes modal", () => {
  let state = searchFlowReducer(createSearchFlowState(BASE_FILTERS), {
    type: "open_mobile_flow",
  });

  state = searchFlowReducer(state, {
    type: "set_draft_patch",
    patch: { minBedrooms: 3 },
  });
  state = searchFlowReducer(state, { type: "apply_mobile_filters" });

  assert.equal(state.isMobileFlowOpen, false);
  assert.equal(state.mobileStep, 1);
  assert.equal(state.appliedFilters.minBedrooms, 3);
});

test("reducer: clear should reset draft and applied", () => {
  let state = createSearchFlowState(BASE_FILTERS);
  state = searchFlowReducer(state, { type: "clear_all_filters" });

  assert.deepEqual(state.appliedFilters, DEFAULT_SEARCH_FILTERS);
  assert.deepEqual(state.draftFilters, DEFAULT_SEARCH_FILTERS);
});

test("reducer: cancel should discard draft changes", () => {
  let state = searchFlowReducer(createSearchFlowState(BASE_FILTERS), {
    type: "open_mobile_flow",
  });

  state = searchFlowReducer(state, {
    type: "set_draft_patch",
    patch: { neighborhood: "Toberín" },
  });
  state = searchFlowReducer(state, { type: "cancel_mobile_flow" });

  assert.equal(state.isMobileFlowOpen, false);
  assert.equal(state.draftFilters.neighborhood, BASE_FILTERS.neighborhood);
});
