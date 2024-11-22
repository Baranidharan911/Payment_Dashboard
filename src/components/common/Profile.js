import React, { useState, useEffect } from 'react';
import { useAuth, db } from '../../services/authservice';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    branch: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        const docRef = doc(db, `users/${currentUser.uid}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          console.log('No such document!');
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const docRef = doc(db, `users/${currentUser.uid}`);
      await updateDoc(docRef, formData);
      setLoading(false);
      toast.success('Profile updated successfully');
      setIsEditing(false); // Switch back to view mode
    } catch (error) {
      setError('Failed to update profile');
      console.error('Error updating document: ', error);
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="profile-container">
      <ToastContainer />
      <h2>Profile</h2>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={!isEditing} />
          </div>
          <div>
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled />
          </div>
          <div>
            <label>Phone Number</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required disabled={!isEditing} />
          </div>
          <div>
            <label>Branch Name</label>
            <input type="text" name="branch" value={formData.branch} onChange={handleChange} required disabled={!isEditing} />
          </div>
          {isEditing ? (
            <button type="submit" disabled={loading}>Submit</button>
          ) : (
            <button type="button" onClick={handleEdit}>Edit</button>
          )}
        </form>
      )}
    </div>
  );
};

export default Profile;
