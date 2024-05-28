import { ChangeEventHandler, KeyboardEventHandler, useState } from "react";
import "./InputGroup.scss";

type InputGroupOpts = {
  disabled?: boolean;
  allowAttachments?: boolean;
  placeholder?: string;
  label?: string;
  handleSubmit?: { (): any | Promise<any> };
  onChange?: { (v: string): void };
};

/** @Component */
export default function InputGroup(opts: InputGroupOpts) {
  const { disabled } = opts;
  const [text, setText] = useState("");
  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    e.preventDefault();
    setText(e.target.value);
    opts.onChange?.(e.target.value);
  };
  const onSubmit: KeyboardEventHandler = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    opts.handleSubmit?.();
    setText("");
  };

  return (
    <label className="input-group">
      {opts.label && <span className="input-group__label">{opts.label}</span>}

      <input
        className="input-group__input"
        disabled={disabled}
        placeholder={opts.placeholder}
        value={text}
        onChange={onChange}
        onKeyDown={onSubmit}
      />

      <button
        disabled={!opts.allowAttachments}
        className="button--attach button--round button--transparent button--grid button--float left"
        type="button"
      >
        <span className="material-symbols-outlined">attach_file</span>
      </button>

      <button className="button--send" disabled={disabled} type="button">
        <span className="material-symbols-outlined">send</span>
      </button>
    </label>
  );
}
