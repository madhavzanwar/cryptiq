"use client";

import { useT } from "@/lib/i18n/provider";
import { useHistory } from "@/lib/stores/history";
import { useSettings } from "@/lib/stores/settings";
import { toast } from "@/lib/stores/toast";
import { useCallback } from "react";

/** localStorage key written by the history store (src/lib/stores/history.ts). */
const HISTORY_KEY = "cryptiq.history";

/**
 * The "Save my checks on this device" switch, shared by /history and /settings.
 * Off (default): nothing is written to localStorage and the saved copy is removed (results stay in memory
 * for this tab only, so permalinks keep working). On: the current in-memory results are written once.
 */
export function useSaveHistory(): { saveHistory: boolean; setSaveHistory: (on: boolean) => void } {
  const { t } = useT();
  const saveHistory = useSettings((s) => s.saveHistory);
  const set = useSettings((s) => s.setSaveHistory);

  const setSaveHistory = useCallback(
    (on: boolean) => {
      set(on);
      if (on) {
        // touching the store makes the persist middleware write the current entries now that saving is allowed
        useHistory.setState((s) => ({ entries: [...s.entries] }));
        toast(t("history.toast.on"), "success");
      } else {
        try {
          localStorage.removeItem(HISTORY_KEY);
        } catch {
          /* storage blocked: nothing was saved anyway */
        }
        toast(t("history.toast.off"), "info");
      }
    },
    [set, t],
  );

  return { saveHistory, setSaveHistory };
}
