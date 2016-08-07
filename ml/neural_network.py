import numpy as np
import json

PARAMS_PATH = "./ml/data/params.json"
TRAINING_DATA_PATH = "./ml/data/training.json"

IDLE = "idle"
UP = "up"
DOWN = "down"
LEFT = "left"
RIGHT = "right"

SAMPLE_SIZE = 50

strToVecOutMap = {
    IDLE: [0, 0, 0, 0, 1],
    UP: [0, 0, 0, 1, 0],
    DOWN: [0, 0, 1, 0, 0],
    LEFT: [0, 1, 0, 0, 0],
    RIGHT: [1, 0, 0, 0, 0]
}

STATES = [IDLE, UP, DOWN, LEFT, RIGHT]
def sigmoid(z):
    return 1 / (1 + np.exp(-z))


def sigmoidDerivative(z):
    a = sigmoid(z)
    return a * (1 - a)

class NeuralNetwork:
    """
    Creates a new Neural Network.

    Args:
        layers - A list of Layers in the order such that the input layer is first and output layer is last. The
    """
    def __init__(self, layers, regularization=0):
        self._layers = layers
        self._lambda = regularization

    """
    Uses the current weights of the Neural Network to predict an output.

    Args:
        X - A m * n matrix containing the inputs to predict, where m is the number of cases
            and n is equal to the number of input features, or number of params in the first layer
    Returns:
        A m * n matrix containing the resulting output, where m is the number of cases and n is
        the number of targets, or the number of nodes in the last layer
    """
    def predict(self, X):
        a = X
        for layer in self._layers:
            a = layer.forwardPropogate(a)
        return a

    """
    Calculates and quantifies the error in accuracy on predicting the given data set for the Neural Network.

    Args:
        X - An m * n matrix containing the input, where m is the number of cases and n is the number of features
        Y - An m * n matrix containing the output to compare against, where m is the number of cases,
            and n is the number of classes / output nodes
        thetaList - If entered, will use this theta instead self's. Theta should be a list of
    Returns:
        A floating point number representing the error
    """
    def calculateCost(self, X, y, thetaList=None):
        ep = 1e-6
        m = X.shape[0]
        J = 0
        for i in range(m):
            if thetaList is None:
                h = self.predict(X)
            else:
                a = X
                for theta in thetaList:
                    m = a.shape[0]
                    a = np.c_[np.ones(m), a]
                    z = np.dot(a, theta.T)
                    a = sigmoid(z)
                h = a
            J += (y * np.log(h + ep) + (1 - y) * np.log(1 - h + ep)).sum()
        J = - J / m
        # Regularization
        reg = 0
        if thetaList is None:
            for layer in self._layers:
                reg += (layer._theta ** 2).sum()
        else:
            for theta in thetaList:
                reg += (theta ** 2).sum()
        reg = self._lambda * reg / (2 * m)
        J += reg
        return J

    """
    Uses backpropagation to train this Neural Network on the given data set

    Args:
        X - An m * n matrix containing the input training data, where m is the number of cases and
            n is the number of features
        Y - An m * n matrix containing the output training data, where m is the number of cases,
            and n is the number of classes / output nodes
        iters - The number of iterations to run gradient descent
        alpha - The learning rate
        checkGrad - If gradient checking should be turned on
        showCost - If the cost should be shown each iter
    """
    def train(self, X, y, iters=200, alpha=0.001, checkGrad=False, showCost=False):
        ep = 1e-5
        m = X.shape[0]
        k = len(self._layers) + 1 # +1 for Input Layer
        for i in range(iters):
            nablas = []
            nablas.append(None)
            for layer in self._layers: # Leaving in input layer for simplicity
                nablas.append(np.zeros(layer._theta.shape))
            # Calculate grads
            for j in range(m):
                # Forward prop
                zVals = []
                activations = []
                a = X[j, :]
                zVals.append(None) # Offset
                activations.append(np.reshape(np.r_[1, a], (1, a.size + 1)))
                for layer in self._layers:
                    z, a = layer.forwardPropogateSingle(a)
                    zVals.append(z)
                    activations.append(np.reshape(np.r_[1, a], (1, a.size + 1)))
                # Back prop
                delta = y[j, :] - a
                delta = np.reshape(delta, (1, delta.size))
                nablas[k - 1] += np.dot(delta.T, activations[k - 2])
                for l in range(k - 2, 0, -1): # Do not include input layer
                    layer = self._layers[l]
                    delta = np.dot(delta, layer._theta) * sigmoidDerivative(np.r_[1, zVals[l]])
                    delta = np.dot(delta.T, activations[l - 1])
                    delta = delta[1:, :] # Ignore bias node
                    nablas[l] += delta
            # Descent dat gradients
            if checkGrad:
                EPSILON = 0.001
                grads = self.calculateNumericGrads(X, y, EPSILON)
                grads.insert(0, None)
            for l in range(1, k): # Skip input layer
                layer = self._layers[l - 1]
                gradient = -nablas[l] # I legit have no idea why doing this works
                # Regularization
                reg = self._lambda * layer._theta[:, 1:]
                gradient[:, 1:] += reg
                if checkGrad and np.abs(gradient - grads[l]).sum() > EPSILON * 10:
                    print("FAILED GRADIENT CHECK! Numeric: ", grads[l], ", Actual: ", gradient)
                layer._theta -= alpha * gradient
            if showCost:
                print("Cost: ", self.calculateCost(X, y))
    def calculateNumericGrads(self, X, y, epsilon):
        grads = []
        thetas = []
        # Crewates the theta listr
        for layer in self._layers:
            thetas.append(layer._theta)

        for k in range(len(thetas)):
            theta = thetas[k]
            grad = np.zeros(theta.shape)
            for i in range(theta.shape[0]):
                for j in range(theta.shape[1]):
                    clonedPos = np.copy(theta)
                    clonedNeg = np.copy(theta)
                    clonedPos[i][j] += epsilon
                    clonedNeg[i][j] -= epsilon
                    thetaPos = list(thetas)
                    thetaNeg = list(thetas)
                    thetaPos[k] = clonedPos
                    thetaNeg[k] = clonedNeg
                    grad[i][j] = (self.calculateCost(X, y, thetaList=thetaPos) - self.calculateCost(X, y, thetaList=thetaNeg)) \
                        / (2 * epsilon)
            grads.append(grad)
        return grads

    """
    Serializes this network into an array of thetas in the format
    {
        thetas: [
            [[float]]
        ]
    }
    """
    def serialize(self):
        hashMap = {}
        layers = []
        for layer in self._layers:
            layers.append(layer._theta.tolist())
        hashMap["thetas"] = layers
        return hashMap

    @staticmethod
    def fromSerialized(hashMap):
        thetas = hashMap["thetas"]
        layers = []
        for theta in thetas:
            layer = Layer(len(theta[0]) - 1, len(theta))
            layer._theta = np.array(theta)
            layers.append(layer)
        ann = NeuralNetwork(layers)
        return ann
class Layer:
    """
    Creates a new Layer to be put into a Neural Network.
    Note that the bias node is already accounted for and does not need to be added in as an additional input.

    Args:
        numInput - The size of the vector that will be given to this layer, not including the bias input.
            If this Layer is the Input Layer, then this is the number of features
            Otherwise, this should be equal to the number of nodes in the previous layer
        numNodes - The size of the vector that t
    """
    def __init__(self, numInput, numNodes):
        self._numInput = numInput
        self._numNodes = numNodes
        self._theta = 0.001 * np.random.rand(numNodes, numInput + 1)

    def validateXSize(self, X):
        assert X.shape[1] == self._numInput, "The given X was a " + str(X.shape[0]) + " * " + str(X.shape[1]) + \
                    " matrix. Expected a " + str(X.shape[0]) + " * " + str(self._numInput) + " matrix."
    """
    Note - This function handles the bias nodes
    """
    def forwardPropogate(self, prevA):
        self.validateXSize(prevA)
        m = prevA.shape[0]
        prevA = np.c_[np.ones(m), prevA]
        z = np.dot(prevA, self._theta.T)
        a = sigmoid(z)
        return a

    def forwardPropogateSingle(self, prevA):
        assert prevA.size == self._numInput, "Expected " + str(self._numInput) + " inputs but received " + str(prevA.size)
        prevA = np.r_[1, prevA]
        z = np.dot(prevA, self._theta.T)
        a = sigmoid(z)
        return z, a


def unrollSamples(samples):
    vec = []
    for sample in samples:
        for val in sample:
            vec.append(val)
    return vec

def createTrainAndSerializeNetwork(data):
    layers = []
    layers.append(Layer(SAMPLE_SIZE * 4, SAMPLE_SIZE))
    layers.append(Layer(SAMPLE_SIZE, len(STATES)))
    ann = NeuralNetwork(layers)
    """
    FORMAT: {
        output: [
            [
                Number,
                Number,
                Number,
                Number,
            ]
        ]
    }
    """
    inp = []
    out = []
    for key, samples in data.items():
        vec = unrollSamples(samples)
        inp.append(vec)
        out.append(strToVecOutMap[key])
    X = np.array(inp)
    y = np.array(out)
    ann.train(X, y)
    serialized = ann.serialize()
    print(serialized)

def predictState(serialized, samples):
    ann = NeuralNetwork.fromSerialized(hashMap)
    X = unrollSamples(samples)
    y = ann.predict(np.array([X])).tolist()[0]
    # One vs. All
    maxIdx = -1
    maxVal = -1 # Min val of sigmoid
    for i in range(len(STATES)):
        if y[i] > maxVal:
            maxIdx = i
            maxVal = y[i]
    print(STATES[i])

def xorTest():
    layers = []
    layers.append(Layer(2, 5))
    layers.append(Layer(5, 1))
    ann = NeuralNetwork(layers)
    X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
    y = np.array([[0], [1], [1], [0]])
    print("Predict: ", ann.predict(X))
    print("BEFORE Cost: ", ann.calculateCost(X, y))
    ann.train(X, y, checkGrad=False)
    print("AFTER Cost: ", ann.calculateCost(X, y))
    print("PREDICT:: ", ann.predict(X))
