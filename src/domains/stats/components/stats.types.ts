// --- WCL state reducer ---
export type WclState = {
	reports: any[];
	isLoading: boolean;
	error: string | null;
	searchQuery: string;
	selectedReport: any;
	reportDetails: any;
	isFetchingDetail: boolean;
	modalTab: "sumario" | "intentos";
	zoneFilter: string;
	tagFilter: string;
	tags: { id: number; name: string }[];
};

export const INITIAL_WCL: WclState = {
	reports: [],
	isLoading: true,
	error: null,
	searchQuery: "",
	selectedReport: null,
	reportDetails: null,
	isFetchingDetail: false,
	modalTab: "sumario",
	zoneFilter: "all",
	tagFilter: "all",
	tags: [],
};

export type WclAction =
	| { type: "SET_REPORTS"; reports: any[] }
	| { type: "SET_LOADING"; isLoading: boolean }
	| { type: "SET_ERROR"; error: string | null }
	| { type: "SET_SEARCH_QUERY"; query: string }
	| { type: "SELECT_REPORT"; report: any }
	| { type: "SET_REPORT_DETAILS"; details: any }
	| { type: "SET_FETCHING_DETAIL"; isFetching: boolean }
	| { type: "SET_MODAL_TAB"; tab: "sumario" | "intentos" }
	| { type: "SET_ZONE_FILTER"; filter: string }
	| { type: "SET_TAG_FILTER"; filter: string }
	| { type: "SET_TAGS"; tags: { id: number; name: string }[] };

export function wclReducer(state: WclState, action: WclAction): WclState {
	switch (action.type) {
		case "SET_REPORTS":
			return { ...state, reports: action.reports };
		case "SET_LOADING":
			return { ...state, isLoading: action.isLoading };
		case "SET_ERROR":
			return { ...state, error: action.error };
		case "SET_SEARCH_QUERY":
			return { ...state, searchQuery: action.query };
		case "SELECT_REPORT":
			return { ...state, selectedReport: action.report };
		case "SET_REPORT_DETAILS":
			return { ...state, reportDetails: action.details };
		case "SET_FETCHING_DETAIL":
			return { ...state, isFetchingDetail: action.isFetching };
		case "SET_MODAL_TAB":
			return { ...state, modalTab: action.tab };
		case "SET_ZONE_FILTER":
			return { ...state, zoneFilter: action.filter };
		case "SET_TAG_FILTER":
			return { ...state, tagFilter: action.filter };
		case "SET_TAGS":
			return { ...state, tags: action.tags };
		default:
			return state;
	}
}

// --- Top Members state reducer ---
export type TopMembersState = {
	members: any[];
	isLoading: boolean;
};

export type TopMembersAction =
	| { type: "SET_MEMBERS"; members: any[] }
	| { type: "SET_LOADING"; isLoading: boolean };

export function topMembersReducer(
	state: TopMembersState,
	action: TopMembersAction,
): TopMembersState {
	switch (action.type) {
		case "SET_MEMBERS":
			return { ...state, members: action.members };
		case "SET_LOADING":
			return { ...state, isLoading: action.isLoading };
		default:
			return state;
	}
}

// --- Inspector state reducer ---
export type InspectorState = {
	selectedMember: any;
	characterData: any;
	isInspecting: boolean;
	error: string | null;
};

export const INITIAL_INSPECTOR: InspectorState = {
	selectedMember: null,
	characterData: null,
	isInspecting: false,
	error: null,
};

export type InspectorAction =
	| { type: "INSPECT_START"; member: any }
	| { type: "INSPECT_SUCCESS"; data: any }
	| { type: "INSPECT_ERROR"; error: string }
	| { type: "INSPECT_RESET" };

export function inspectorReducer(
	state: InspectorState,
	action: InspectorAction,
): InspectorState {
	switch (action.type) {
		case "INSPECT_START":
			return {
				...state,
				selectedMember: action.member,
				isInspecting: true,
				error: null,
			};
		case "INSPECT_SUCCESS":
			return { ...state, characterData: action.data, isInspecting: false };
		case "INSPECT_ERROR":
			return {
				...state,
				error: action.error,
				characterData: null,
				isInspecting: false,
			};
		case "INSPECT_RESET":
			return INITIAL_INSPECTOR;
		default:
			return state;
	}
}
