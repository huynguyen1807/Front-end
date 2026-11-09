import { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type Refresh = (signal: AbortSignal) => Promise<boolean | void>;
type Clock = { setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout };

// Exported so the actual scheduling logic can be checked with a virtual clock.
export function createHouseholdSync(refresh: Refresh, clock: Clock = { setTimeout, clearTimeout }) {
  let active = false;
  let polling = false;
  let paused = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flight: { abort: AbortController; promise: Promise<void> } | undefined;
  const clearTimer = () => { if (timer !== undefined) clock.clearTimeout(timer); timer = undefined; };
  const schedule = () => {
    clearTimer();
    if (!active || !polling || paused || flight) return;
    timer = clock.setTimeout(() => { timer = undefined; void request(); }, Math.min(120000, 20000 * 2 ** Math.min(failures, 3)));
  };
  const cancel = () => { clearTimer(); const old = flight; flight = undefined; old?.abort.abort(); };
  const request = (): Promise<void> => {
    if (!active || paused) return Promise.resolve();
    if (flight) return flight.promise;
    clearTimer();
    const task = { abort: new AbortController(), promise: Promise.resolve() };
    flight = task;
    task.promise = Promise.resolve().then(async () => {
      if (task.abort.signal.aborted) return;
      try {
        const success = await refresh(task.abort.signal);
        if (flight === task) failures = success === false ? failures + 1 : 0;
      } catch {
        if (flight === task) failures++;
      } finally {
        if (flight === task) { flight = undefined; schedule(); }
      }
    });
    return task.promise;
  };
  return {
    refresh: request,
    cancel,
    start() { if (!active) { active = true; void request(); } },
    stop() { active = false; cancel(); },
    setPolling(value: boolean) { polling = value; schedule(); },
    pause() { paused = true; cancel(); },
    resume() { if (paused) { paused = false; void request(); } },
  };
}

export function useHouseholdSync({ scopeKey, polling, refresh }: { scopeKey: string; polling: boolean; refresh: Refresh }) {
  const callback = useRef(refresh);
  callback.current = refresh;
  const focused = useRef(false);
  const controller = useMemo(() => createHouseholdSync(signal => callback.current(signal)), [scopeKey]);
  const foreground = () => (AppState.currentState == null || AppState.currentState === 'active')
    && (Platform.OS !== 'web' || document.visibilityState !== 'hidden');

  useEffect(() => { controller.setPolling(polling); }, [controller, polling]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    if (foreground()) controller.start();
    return () => { focused.current = false; controller.stop(); };
  }, [controller]));
  useEffect(() => {
    const update = () => {
      if (focused.current && foreground()) controller.start();
      else controller.stop();
    };
    const focus = () => { update(); if (focused.current && foreground()) void controller.refresh(); };
    const subscription = AppState.addEventListener('change', update);
    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', update);
      window.addEventListener('focus', focus);
    }
    return () => {
      subscription.remove(); controller.stop();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', update);
        window.removeEventListener('focus', focus);
      }
    };
  }, [controller]);
  return controller;
}
