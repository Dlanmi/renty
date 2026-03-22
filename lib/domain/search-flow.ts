import {
  DEFAULT_SEARCH_FILTERS,
  type SearchFilters,
} from "@/lib/domain/search";

export interface SearchFlowState {
  appliedFilters: SearchFilters;
  draftFilters: SearchFilters;
  isMobileFlowOpen: boolean;
  mobileStep: 1 | 2 | 3;
}

export type SearchFlowAction =
  | { type: "sync_from_url"; filters: SearchFilters }
  | { type: "set_applied_filters"; filters: SearchFilters }
  | { type: "set_draft_patch"; patch: Partial<SearchFilters> }
  | { type: "open_mobile_flow" }
  | { type: "cancel_mobile_flow" }
  | { type: "set_mobile_step"; step: 1 | 2 | 3 }
  | { type: "next_mobile_step" }
  | { type: "prev_mobile_step" }
  | { type: "apply_mobile_filters" }
  | { type: "clear_all_filters" };

export function createSearchFlowState(
  initialFilters: SearchFilters = DEFAULT_SEARCH_FILTERS
): SearchFlowState {
  return {
    appliedFilters: initialFilters,
    draftFilters: initialFilters,
    isMobileFlowOpen: false,
    mobileStep: 1,
  };
}

export function searchFlowReducer(
  state: SearchFlowState,
  action: SearchFlowAction
): SearchFlowState {
  switch (action.type) {
    case "sync_from_url": {
      if (state.isMobileFlowOpen) {
        return {
          ...state,
          appliedFilters: action.filters,
        };
      }

      return {
        ...state,
        appliedFilters: action.filters,
        draftFilters: action.filters,
      };
    }

    case "set_applied_filters":
      return {
        ...state,
        appliedFilters: action.filters,
      };

    case "set_draft_patch":
      return {
        ...state,
        draftFilters: { ...state.draftFilters, ...action.patch },
      };

    case "open_mobile_flow":
      return {
        ...state,
        isMobileFlowOpen: true,
        mobileStep: 1,
        draftFilters: state.appliedFilters,
      };

    case "cancel_mobile_flow":
      return {
        ...state,
        isMobileFlowOpen: false,
        mobileStep: 1,
        draftFilters: state.appliedFilters,
      };

    case "set_mobile_step":
      return {
        ...state,
        mobileStep: action.step,
      };

    case "next_mobile_step":
      return {
        ...state,
        mobileStep: Math.min(3, state.mobileStep + 1) as 1 | 2 | 3,
      };

    case "prev_mobile_step":
      return {
        ...state,
        mobileStep: Math.max(1, state.mobileStep - 1) as 1 | 2 | 3,
      };

    case "apply_mobile_filters":
      return {
        ...state,
        appliedFilters: state.draftFilters,
        isMobileFlowOpen: false,
        mobileStep: 1,
      };

    case "clear_all_filters":
      return {
        ...state,
        appliedFilters: DEFAULT_SEARCH_FILTERS,
        draftFilters: DEFAULT_SEARCH_FILTERS,
        mobileStep: 1,
      };

    default:
      return state;
  }
}
