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
    print("BEFORE COST: ", ann.calculateCost(X, y))
    ann.train(X, y, showCost=True)
    print("AFTER COST: ", ann.calculateCost(X, y))
    serialized = ann.serialize()

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

data = {
    "idle" : [
      [
        27.96466636657715,
        325.70611572265625,
        111.8586654663086,
        421.1149597167969
      ],
      [
        27.96466636657715,
        220.4273681640625,
        111.8586654663086,
        315.8362121582031
      ],
      [
        27.96466636657715,
        325.70611572265625,
        164.49803161621094,
        526.3937377929688
      ],
      [
        27.96466636657715,
        220.4273681640625,
        164.49803161621094,
        631.6724243164062
      ],
      [
        27.96466636657715,
        115.14862060546875,
        59.21929168701172,
        210.55747985839844
      ],
      [
        27.96466636657715,
        325.70611572265625,
        190.81771850585938,
        526.3937377929688
      ],
      [
        27.96466636657715,
        220.4273681640625,
        111.8586654663086,
        315.8362121582031
      ],
      [
        27.96466636657715,
        167.78799438476562,
        138.1783447265625,
        421.1149597167969
      ],
      [
        27.96466636657715,
        273.0667419433594,
        217.1374053955078,
        631.6724243164062
      ],
      [
        27.96466636657715,
        430.98486328125,
        296.0964660644531,
        1158.066162109375
      ],
      [
        27.96466636657715,
        273.0667419433594,
        164.49803161621094,
        315.8362121582031
      ],
      [
        27.96466636657715,
        251.68199157714844,
        123.37352752685547,
        631.6724243164062
      ],
      [
        27.96466636657715,
        203.97756958007812,
        92.118896484375,
        210.55747985839844
      ],
      [
        26.319684982299805,
        284.58160400390625,
        139.82333374023438,
        210.55747985839844
      ],
      [
        27.96466636657715,
        251.68199157714844,
        123.37352752685547,
        210.55747985839844
      ],
      [
        27.96466636657715,
        440.854736328125,
        208.91250610351562,
        421.1149597167969
      ],
      [
        27.96466636657715,
        546.1334838867188,
        208.91250610351562,
        736.951171875
      ],
      [
        27.96466636657715,
        440.854736328125,
        156.27313232421875,
        210.55747985839844
      ],
      [
        27.96466636657715,
        440.854736328125,
        156.27313232421875,
        842.2299194335938
      ],
      [
        27.96466636657715,
        282.9366149902344,
        103.63375854492188,
        421.1149597167969
      ],
      [
        27.96466636657715,
        72.37913513183594,
        50.99439239501953,
        105.27873992919922
      ],
      [
        29.60964584350586,
        282.9366149902344,
        156.27313232421875,
        315.8362121582031
      ],
      [
        27.96466636657715,
        282.9366149902344,
        156.27313232421875,
        315.8362121582031
      ],
      [
        27.96466636657715,
        388.2153625488281,
        103.63375854492188,
        315.8362121582031
      ],
      [
        27.96466636657715,
        177.6578826904297,
        50.99439239501953,
        736.951171875
      ],
      [
        27.96466636657715,
        282.9366149902344,
        157.91810607910156,
        736.951171875
      ],
      [
        27.96466636657715,
        388.2153625488281,
        105.27873992919922,
        526.3937377929688
      ],
      [
        27.96466636657715,
        254.97195434570312,
        134.8883819580078,
        1163.0010986328125
      ],
      [
        27.96466636657715,
        412.89007568359375,
        189.17274475097656,
        952.443603515625
      ],
      [
        27.96466636657715,
        412.89007568359375,
        194.10768127441406,
        636.607421875
      ],
      [
        27.96466636657715,
        202.33258056640625,
        69.08917236328125,
        215.492431640625
      ],
      [
        27.96466636657715,
        360.2507019042969,
        185.88278198242188,
        952.443603515625
      ],
      [
        27.96466636657715,
        307.611328125,
        185.88278198242188,
        636.607421875
      ],
      [
        31.254627227783203,
        202.33258056640625,
        133.243408203125,
        426.0498962402344
      ],
      [
        27.96466636657715,
        254.97195434570312,
        133.243408203125,
        426.0498962402344
      ],
      [
        27.96466636657715,
        307.611328125,
        133.243408203125,
        215.492431640625
      ],
      [
        27.96466636657715,
        254.97195434570312,
        133.243408203125,
        162.85305786132812
      ],
      [
        27.96466636657715,
        412.89007568359375,
        185.88278198242188,
        426.0498962402344
      ],
      [
        27.96466636657715,
        307.611328125,
        185.88278198242188,
        215.492431640625
      ],
      [
        27.96466636657715,
        254.97195434570312,
        185.88278198242188,
        847.1648559570312
      ],
      [
        29.60964584350586,
        44.41447067260742,
        133.243408203125,
        320.77117919921875
      ],
      [
        31.254627227783203,
        210.55747985839844,
        185.88278198242188,
        215.492431640625
      ],
      [
        26.319684982299805,
        315.8362121582031,
        80.60403442382812,
        426.0498962402344
      ],
      [
        26.319684982299805,
        210.55747985839844,
        80.60403442382812,
        110.21368408203125
      ],
      [
        27.96466636657715,
        342.1559143066406,
        126.66348266601562,
        531.3286743164062
      ],
      [
        27.96466636657715,
        421.1149597167969,
        152.98316955566406,
        531.3286743164062
      ],
      [
        27.96466636657715,
        368.4755859375,
        159.56309509277344,
        531.3286743164062
      ],
      [
        27.96466636657715,
        315.8362121582031,
        126.66348266601562,
        426.0498962402344
      ],
      [
        27.96466636657715,
        263.1968688964844,
        74.02411651611328,
        215.492431640625
      ],
      [
        27.96466636657715,
        210.55747985839844,
        74.02411651611328,
        268.1318054199219
      ]
    ]
}
layers = []
layers.append(Layer(SAMPLE_SIZE * 4, SAMPLE_SIZE * 7))
layers.append(Layer(SAMPLE_SIZE * 7, len(STATES)))
ann = NeuralNetwork(layers)
inp = []
out = []
for key, samples in data.items():
    vec = unrollSamples(samples)
    inp.append(vec)
    out.append(strToVecOutMap[key])
X = np.array(inp)
y = np.array(out)
print("BEFORE COST: ", ann.calculateCost(X, y))
ann.train(X, y, showCost=True)
print("AFTER COST: ", ann.calculateCost(X, y))
serialized = ann.serialize()
