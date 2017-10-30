/**
 * IMPORTS
 *
 * Just the minimum:
 * React, Buttons, Permissions
**/

import React from 'react'
import { StyleSheet, View, Button, Text } from 'react-native'
import { Location, Permissions } from 'expo'

/**
 * APP COMPONENT
 *
 * The only component that is needed for this task
**/

export default class App extends React.Component {

  /**
   * STATE
   *
   * Since there is no threading mechanism in react native
   * we are using setTimeout for T1 and T2 iterations
   * and a simple function for T3 (which is called by
   * another "thread", componentDidUpdate(), checking
   * if length of L list is more than 3 items)
  **/

  state = {
    running: false,                      // are threads running?
    permissions: false,                  // permissions
    location: {},                        // starting with null location
    t1: null,                            // starting as null, then setInterval, then clearInterval
    t2: null,                            // same as above
    t3: (url) => this._threadThree(url), // called only if l.length > 3
    l: [],                               // starting with empty list
  }

  /**
   * HELPERS
   *
   * request permissions for location, will work only the first time
  **/

  _getPermissions = async () => {
    console.log('requesting permissions...')
    let { status } = await Permissions.askAsync(Permissions.LOCATION)
    console.log('status', status)
    if (status === 'granted') {
      this.setState({ permissions: true })
      this._getLocation()
    }
  }

  /* get current location for T1 */

  _getLocation = async () => {
    let location = await Location.getCurrentPositionAsync({})
    let formattedLocation = location.coords.latitude + ',' + location.coords.longitude
    this.setState({ location: formattedLocation })
  }

  /* make POST request to given url with data */

  _makePostRequest = async (url, data) => {
    const body = JSON.stringify({
      data: data,
    })
    const headers = new Headers()
    headers.append('Content-Type', 'application/json')
    headers.append('Content-Length', body.length)
    const params = {
      method: 'POST',
      headers: headers,
      body: body,
    }
    const response = await fetch(url, params)
    console.log('response status', response.status)
  }

  /**
   * THREADS
   *
   * This is the iteration for T1. The first _getLocation is called
   * immediatly after componentDidMount(), so for the iteration
   * we just update the L list with what's in the state and
   * wait for the location update for the next iteration
  **/

  _threadOne = () => {
    console.log('T1 iteration')

    const { location } = this.state
    this._getLocation();
    this.setState({
      l: [
        ...this.state.l,
        location,
      ]
    })
  }

  /**
   * This is the T2 iteration. We randomly
   * choose a number between 0 and 100%
  **/

  _threadTwo = () => {
    console.log('T2 iteration')

    const simulateBattery = Math.floor( Math.random() * 100 ) + '%'
    this.setState({
      l: [
        ...this.state.l,
        simulateBattery,
      ]
    })
  }

  /**
   * This is the T3 iteration. Called by componentDidUpdate
   * if there is more than 3 items in the L list, so it is
   * idle for the rest of runtime. It gets the L items, joins
   * them by a plus sign and then makes a request, after
   * clearing the L list (for clean console output)
  **/

  _threadThree = async (url) => {
    console.log('T3 iteration')

    const { l } = this.state
    const joinedList = l.join('+')
    this.setState({
      l: [],
    })
    await this._makePostRequest(url, joinedList)
  }

  /**
   * COMPONENT LIFECYCLE
   *
   * First, get permissions for first location call
  **/

  componentWillMount = () => {
    this._getPermissions()
  }

  /**
   * This function works with the T3 thread and calls
   * it's iteration when L items number exceeds 3 items
  **/

  componentDidUpdate() {
    if ( this.state.l.length > 3 ) {
      this.state.t3('https://kovalsky.pl')
    }
  }

  /**
   * INTERACTIONS
   *
   * Pressing the start button starts the T1 and T2 threads,
   * as T3 is called by componentDidUpdate later
  **/

  _handleStartPress = () => {
    const { running } = this.state
    if ( !running ) {
      console.log('START')
      this.setState({
        running: true,
        t1: setInterval(() => {
          this._threadOne()
        }, 1000),
        t2: setInterval(() => {
          this._threadTwo()
        }, 2000),
      })
    } else {
      console.log('already running')
    }
  }

  /**
   * Pressing the stop button clears T1 and T2 intervals,
   * shutting down state updates and so the T3 as well
  **/

  _handleStopPress = () => {
    const { running } = this.state
    if ( running ) {
      console.log('STOP')
      const { t1, t2 } = this.state
      clearInterval(t1);
      clearInterval(t2);
      this.setState({ running: false })
    } else {
      console.log('nothing to stop')
    }
  }

  /**
   * RENDER
   *
   * Just for the buttons, nothing more
  **/

  render() {
    return (
      <View style={styles.container}>
        <Button onPress={this._handleStartPress} title="START" />
        <Button onPress={this._handleStopPress} title="STOP" />
        {!this.state.permissions
          && <Text>Permissions were denied</Text>}
      </View>
    )
  }
}

/* nobody wants to be ugly or uncentered */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
