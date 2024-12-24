import React, { useState } from 'react'
import {BsSend} from 'react-icons/bs'
import useGetCompletion from '../../hooks/useGetCompletion'

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const {getCompletion} = useGetCompletion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!message) return;
    let m = message;
    setMessage("");
    getCompletion(m);
  }

  return (
    <form className='w-full bottom-0 pb-4 pl-4 pr-4' onSubmit={handleSubmit}>
        <div className=' relative w-full'>
            <input type="text" 
                className='input input-bordered input-primary block w-full pr-10 p-2.5 text-black'
                placeholder='Type here...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}/>
            <button type='submit' className='absolute inset-y-0 end-0 right-0 pr-3 flex items-center pe-3'>
                   <BsSend/>
            </button>
                
        </div>


    </form>
  )
}

export default MessageInput