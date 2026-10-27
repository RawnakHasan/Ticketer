import { CircleAlert } from "lucide-react";
import { useId, useState, type ComponentProps, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  textFieldContainerVariants,
  textFieldLabelVariants,
  textFieldSlots,
  textFieldVariants,
  textFieldWrapperVariants,
} from "@/components/ui/TextField/variant";

type FieldValue = string | number | readonly string[] | undefined;

type TextFieldOwnProps = {
  variant?: "filled" | "outlined";
  // Required: it is the floating label and the accessible name
  label: string;
  // Shown under the field. With `error` it becomes the error message.
  supportingText?: ReactNode;
  error?: boolean;
  leadingIcon?: ReactNode;
  // An error replaces it with the error icon. Put a button here for a clear button.
  trailingIcon?: ReactNode;
  // Only visible while the label is floated
  prefixText?: string;
  suffixText?: string;
  // Shows "length/maxLength", needs maxLength
  counter?: boolean;
  // Goes on the root, which is the element to size
  className?: string;
};

type ShellProps = TextFieldOwnProps & {
  controlId: string;
  supportId: string;
  disabled?: boolean;
  maxLength?: number;
  length: number;
  children: ReactNode;
};

function TextFieldShell({
  variant = "filled",
  label,
  supportingText,
  error = false,
  leadingIcon,
  trailingIcon,
  prefixText,
  suffixText,
  counter,
  className,
  controlId,
  supportId,
  disabled,
  maxLength,
  length,
  children,
}: ShellProps) {
  const invalid = error && !disabled;
  const trailing = invalid ? <CircleAlert /> : trailingIcon;
  const showCounter = counter && maxLength !== undefined;

  // Clicks on the padding and the label area focus the control
  function focusControl(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("input, textarea, button, a, [role=button]")) return;
    event.preventDefault();
    document.getElementById(controlId)?.focus();
  }

  return (
    <div
      data-slot="text-field"
      data-variant={variant}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={cn(textFieldVariants({ variant, leading: Boolean(leadingIcon) }), className)}
    >
      <div
        data-slot="text-field-container"
        onPointerDown={focusControl}
        className={textFieldContainerVariants({
          variant,
          leading: Boolean(leadingIcon),
          trailing: Boolean(trailing),
        })}
      >
        {variant === "outlined" && (
          <fieldset aria-hidden="true" className={textFieldSlots.outline}>
            <legend className={textFieldSlots.outlineLegend}>
              <span className="inline-block px-1">{label}</span>
            </legend>
          </fieldset>
        )}

        {leadingIcon && (
          <span
            data-slot="text-field-leading"
            aria-hidden="true"
            className={cn(
              textFieldSlots.icon,
              "me-4 text-on-surface-variant group-data-disabled/field:text-(--tf-dis)",
            )}
          >
            {leadingIcon}
          </span>
        )}

        <div data-slot="text-field-wrapper" className={textFieldWrapperVariants({ variant })}>
          {prefixText && <span className={textFieldSlots.prefix}>{prefixText}</span>}
          {children}
          {suffixText && <span className={textFieldSlots.suffix}>{suffixText}</span>}
          <label htmlFor={controlId} className={textFieldLabelVariants({ variant })}>
            {label}
          </label>
        </div>

        {trailing && (
          <span
            data-slot="text-field-trailing"
            className={cn(textFieldSlots.icon, "ms-4 text-(--tf-trail)")}
          >
            {trailing}
          </span>
        )}
      </div>

      {(supportingText || showCounter) && (
        <div className={textFieldSlots.support}>
          <span
            id={supportId}
            aria-live={invalid ? "polite" : undefined}
            className="min-w-0 flex-1"
          >
            {supportingText}
          </span>
          {showCounter && (
            <span className="ms-auto shrink-0">
              {length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function lengthOf(value: FieldValue): number {
  if (value === undefined) return 0;
  if (typeof value === "string") return value.length;
  if (typeof value === "number") return String(value).length;
  return value.join(",").length; // string[] (only <select multiple> really uses this)
}

// Works for controlled and uncontrolled fields
function useValueLength(value: FieldValue, defaultValue: FieldValue) {
  const [typed, setTyped] = useState(() => lengthOf(defaultValue));
  const length = value !== undefined ? lengthOf(value) : typed;
  return [length, setTyped] as const;
}

function describedBy(own: string | undefined, supportId: string, hasSupport: boolean) {
  return [own, hasSupport ? supportId : undefined].filter(Boolean).join(" ") || undefined;
}

// <TextField variant="outlined" label="Email" supportingText="We never share it" />
type TextFieldProps = Omit<ComponentProps<"input">, "className" | "prefix"> & TextFieldOwnProps;

function TextField({
  variant,
  label,
  supportingText,
  error,
  leadingIcon,
  trailingIcon,
  prefixText,
  suffixText,
  counter,
  className,
  id,
  disabled,
  maxLength,
  value,
  defaultValue,
  placeholder,
  onChange,
  "aria-describedby": describedByProp,
  ...props
}: TextFieldProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const supportId = `${controlId}-support`;
  const [length, setLength] = useValueLength(value, defaultValue);

  return (
    <TextFieldShell
      {...{ variant, label, supportingText, error, leadingIcon, trailingIcon }}
      {...{ prefixText, suffixText, counter, className, controlId, supportId, disabled }}
      maxLength={maxLength}
      length={length}
    >
      <input
        data-slot="text-field-control"
        id={controlId}
        className={textFieldSlots.input}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        // A placeholder is always set: the CSS uses :placeholder-shown to know the field is empty
        placeholder={placeholder ?? " "}
        aria-invalid={error && !disabled ? true : undefined}
        aria-describedby={describedBy(describedByProp, supportId, Boolean(supportingText))}
        onChange={(event) => {
          setLength(event.target.value.length);
          onChange?.(event);
        }}
        {...props}
      />
    </TextFieldShell>
  );
}

// Multi-line: starts one line tall and grows with its content (field-sizing, so Chromium and Safari 26+;
// other browsers keep `rows` lines)
type TextAreaProps = Omit<ComponentProps<"textarea">, "className" | "prefix"> & TextFieldOwnProps;

function TextArea({
  variant,
  label,
  supportingText,
  error,
  leadingIcon,
  trailingIcon,
  prefixText,
  suffixText,
  counter,
  className,
  id,
  disabled,
  maxLength,
  value,
  defaultValue,
  placeholder,
  rows = 1,
  onChange,
  "aria-describedby": describedByProp,
  ...props
}: TextAreaProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const supportId = `${controlId}-support`;
  const [length, setLength] = useValueLength(value, defaultValue);

  return (
    <TextFieldShell
      {...{ variant, label, supportingText, error, leadingIcon, trailingIcon }}
      {...{ prefixText, suffixText, counter, className, controlId, supportId, disabled }}
      maxLength={maxLength}
      length={length}
    >
      <textarea
        data-slot="text-field-control"
        id={controlId}
        className={textFieldSlots.textarea}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder ?? " "}
        aria-invalid={error && !disabled ? true : undefined}
        aria-describedby={describedBy(describedByProp, supportId, Boolean(supportingText))}
        onChange={(event) => {
          setLength(event.target.value.length);
          onChange?.(event);
        }}
        {...props}
      />
    </TextFieldShell>
  );
}

export { TextArea, TextField };
