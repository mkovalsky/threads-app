import 'react-native'
import React from 'react'
import App from '../App'
import renderer from 'react-test-renderer'

test('Renders correctly', () => {
  const tree = renderer.create(
    <App />
  ).toJSON()
  expect(tree).toMatchSnapshot()
})
