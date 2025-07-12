import React, { useRef } from 'react';
import SignaturePad from 'react-signature-pad-wrapper';
import { Button } from 'react-bootstrap';

const SignatureCapture = ({ onSave }) => {
  const sigRef = useRef(null);

  const clear = () => {
    sigRef.current.clear();
  };

  const save = () => {
    if (!sigRef.current.isEmpty()) {
      const dataURL = sigRef.current.toDataURL();
      onSave(dataURL); // send image to parent (e.g. invoice preview or backend)
    } else {
      alert("Please sign before saving.");
    }
  };

  return (
    <div className="p-3 border rounded shadow-sm bg-light">
      <h5 className="mb-3">Digital Signature</h5>
      <SignaturePad
        ref={sigRef}
        options={{
          penColor: "black",
          backgroundColor: "white",
          minWidth: 1.5,
          maxWidth: 2.5
        }}
        style={{ width: '100%', height: '200px', border: '1px solid #ccc' }}
      />
      <div className="mt-3 d-flex gap-2">
        <Button variant="secondary" onClick={clear}>Clear</Button>
        <Button variant="primary" onClick={save}>Save Signature</Button>
      </div>
    </div>
  );
};

export default SignatureCapture;
