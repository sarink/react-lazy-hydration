import * as React from "react";
declare type RequestIdleCallbackHandle = number;
declare type RequestIdleCallbackOptions = {
  timeout: number;
};
declare type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};
declare global {
  interface Window {
    requestIdleCallback?: (
      callback: (deadline: RequestIdleCallbackDeadline) => void,
      opts?: RequestIdleCallbackOptions
    ) => RequestIdleCallbackHandle;
    cancelIdleCallback?: (handle: RequestIdleCallbackHandle) => void;
  }
}
export declare type LazyProps = {
  ssrOnly?: boolean;
  whenIdle?: boolean;
  whenVisible?: boolean;
  noWrapper?: boolean;
  didHydrate?: VoidFunction;
  promise?: Promise<any>;
  on?: (keyof HTMLElementEventMap)[] | keyof HTMLElementEventMap;
  listenOnEl?:
    | HTMLElementTagNameMap[keyof HTMLElementTagNameMap]
    | HTMLDocument
    | Window;
};
declare type Props = Omit<
  React.HTMLProps<HTMLDivElement>,
  "dangerouslySetInnerHTML"
> &
  LazyProps;
declare type VoidFunction = () => void;
declare const LazyHydrate: React.FunctionComponent<Props>;
export default LazyHydrate;
