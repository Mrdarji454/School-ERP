import { forwardRef, useState } from 'react';
import InputField from './InputField';
const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [show, setShow] = useState(false);
  return <div><InputField ref={ref} {...props} type={show ? 'text' : 'password'} autoComplete={props.autoComplete || 'new-password'} /><button type="button" aria-pressed={show} aria-label={`${show ? 'Hide' : 'Show'} ${props.label || 'password'}`} className="mt-1 rounded px-2 py-1 text-sm text-blue-700" onClick={() => setShow(!show)}>{show ? 'Hide password' : 'Show password'}</button></div>;
});
export default PasswordField;
