const APP_ID = '140ae2d8a4934597a0301643f0b072de'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'))

let NAME = sessionStorage.getItem('name')



const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = [] // Stores cam & audio
let remoteUsers = {} // Stores remote users


let joinAndDisplayLocalStream = async () => {
    
    document.getElementById('room-name').innerText = CHANNEL
    document.querySelector('title').innerText = `${CHANNEL.charAt(0).toUpperCase() + CHANNEL.toLowerCase().slice(1)} - Mobeecall`
    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)
    try{
        await client.join(APP_ID, CHANNEL, TOKEN, UID) // Joins channel
    }
    catch(error){
        console.error(error)
        window.open('/', '_self')
    }

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() // Creates cam & audio

    let member = await createMember()
    let player = `<div class="video-cont" id="user-cont-${UID}">
                        <div class="username-wrap"><span class="username">${member.name}</span></div>
                        <div class="video-player" id="user-${UID}"><div id="pulse-wrapper">
                        <div class="pulse"></div>  
                    </div></div>
                    </div>`

    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player) // Adds player to template

    localTracks[1].play(`user-${UID}`) // Plays video feed

    await client.publish([localTracks[0], localTracks[1]]) // Allows all user to see cam/audio

}


let handleUserJoined = async (user, mediaType) => {

    remoteUsers[user.uid] = user // Targets user in remote user object 
    await client.subscribe(user, mediaType) // waits for use to 'connect'

    if(mediaType === 'video'){
        let player = document.getElementById(`user-cont-${user.uid}`) // checks if player already exists
        if (player != null){
            player.remove() // deletes existing player
        }

        let member = await getMember(user)
        
        
        // Creates new player
        player = `<div class="video-cont" id="user-cont-${user.uid}">
                        <div class="username-wrap"><span class="username">${member.name}</span></div>
                        <div class="video-player" id="user-${user.uid}">
                    </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player) 

        user.videoTrack.play(`user-${user.uid}`) // plays remote users video
    }

    if (mediaType === 'audio'){
        user.audioTrack.play() // plays remote users audio
    }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-cont-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
    for (let i=0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()

    deleteMember()
    window.open('/', '_self')
}

let toggleCam = async (e) => {
    if (localTracks[1].muted){ // Checks if camera is off
        await localTracks[1].setMuted(false) // turns on camera
        document.getElementById('cam-toggle').innerHTML = `<img class="control-img" src='/static/images/camon.svg'>`
    }
    else { // checks if its on
        await localTracks[1].setMuted(true) // turns off camera
        document.getElementById('cam-toggle').innerHTML = `<img class="control-img" src='/static/images/camoff.svg'>`
    }
}

let toggleMic = async (e) => {
    if (localTracks[0].muted){
        await localTracks[0].setMuted(false)
        document.getElementById('mic-toggle').innerHTML = `<img class="control-img" src='/static/images/micon.svg'>`
        document.getElementById('pulse-wrapper').style.display='block'
    }
    else {
        await localTracks[0].setMuted(true)
        document.getElementById('mic-toggle').innerHTML = `<img class="control-img" src='/static/images/micoff.svg'>`
        document.getElementById('pulse-wrapper').style.display='none'

    }
}

let createMember = async () => {
    let response = await fetch('/create_member/', {
        method: 'POST',
        headers:{
            'Content-type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID': UID})
    })
    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method: 'POST',
        headers:{
            'Content-type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID': UID})
    })
    let member = await response.json()
    
}


joinAndDisplayLocalStream()

window.addEventListener('beforeunload', deleteMember)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('cam-toggle').addEventListener('click', toggleCam)
document.getElementById('mic-toggle').addEventListener('click', toggleMic)
