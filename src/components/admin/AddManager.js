import React, { useRef, useState } from 'react';
import { auth, db } from '../../services/authservice';
import { setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importing icons
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/addmanager.css';

const AddManager = () => {
  const nameRef = useRef();
  const emailRef = useRef();
  const phoneRef = useRef();
  const branchRef = useRef();
  const locationRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordRef.current.value !== confirmPasswordRef.current.value) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailRef.current.value, passwordRef.current.value);
      const user = userCredential.user;

      await setDoc(doc(db, `users/${user.uid}`), {
        name: nameRef.current.value,
        email: emailRef.current.value,
        phone: phoneRef.current.value,
        branch: branchRef.current.value,
        location: locationRef.current.value,
        role: 'manager'
      });

      // Clear input fields
      nameRef.current.value = '';
      emailRef.current.value = '';
      phoneRef.current.value = '';
      branchRef.current.value = '';
      locationRef.current.value = '';
      passwordRef.current.value = '';
      confirmPasswordRef.current.value = '';

      setLoading(false);
      toast.success('Manager added successfully');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else {
        setError('Failed to create account');
      }
      console.error('Error adding document: ', error);
      setLoading(false);
    }
  };

  return (
    <div className="add-manager-container">
      <ToastContainer />
      <h2>Add Branch</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input type="text" ref={nameRef} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" ref={emailRef} required />
        </div>
        <div>
          <label>Phone Number</label>
          <input type="text" ref={phoneRef} required />
        </div>
        <div>
          <label>Branch Name</label>
          <input type="text" ref={branchRef} required />
        </div>
        <div>
          <label>Location</label>
          <input type="text" ref={locationRef} required />
        </div>
        <div className="password-container">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            ref={passwordRef}
            required
          />
          <span onClick={togglePasswordVisibility}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <div className="password-container">
          <label>Confirm Password</label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            ref={confirmPasswordRef}
            required
          />
          <span onClick={toggleConfirmPasswordVisibility}>
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button disabled={loading} type="submit">Add Manager</button>
      </form>
    </div>
  );
};

export default AddManager;
