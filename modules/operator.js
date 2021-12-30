// 弧度
var RADIAN = Math.PI / 180.0;


// 四元数运算
var Quaternion = {};
// --四元数求Norm
Quaternion.Norm = q => {
    return q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
};
// --四元数缩放k倍
Quaternion.Scaling = (k, q) => {
    return [k * q[0], k * q[1], k * q[2], k * q[3]];
};
// --四元数向量相加
Quaternion.Add = (q1, q2) => {
    return [q1[0] + q2[0], q1[1] + q2[1], q1[2] + q2[2], q1[3] + q2[3]];
};
// --四元数向量相乘
Quaternion.Multiplication = (q1, q2) => {
    var a1 = q1[0], b1 = q1[1], c1 = q1[2], d1 = q1[3];
    var a2 = q2[0], b2 = q2[1], c2 = q2[2], d2 = q2[3];
    return [
        a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2, 
        a1 * b2 + a2 * b1 + c1 * d2 - d1 * c2, 
        a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2, 
        a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2
    ];
};
// --四元数共轭
Quaternion.Conjugation = q => {
    return [q[0], -q[1], -q[2], -q[3]]; 
};
// --四元数求逆
Quaternion.Inverse = q => {
    return Quaternion.Scaling(1 / Quaternion.Norm(q), Quaternion.Conjugation(q));
};
// --四元数求乘方
Quaternion.Power = (q, n) => {
    if(n == -1) {
        return Quaternion.Inverse(q);
    }
    var alpha = Math.acos(q[0]), nalpha = alpha * n;
    var result = Quaternion.Scaling(Math.sin(nalpha) / Math.sin(alpha), q);
    result[0] = Math.cos(nalpha);
    return result;
};
// --三维向量转四元数
Quaternion.Vector2Quaternion = v => {
    return [0, v[0], v[1], v[2]]; 
};
// --四元数转三维向量
Quaternion.Quaternion2Vector = q => {
    return [q[1], q[2], q[3]]; 
};
// --旋转四元数
Quaternion.RotateQuaternion = (u, theta) => {
    return [Math.cos(theta / 2), Math.sin(theta / 2) * u[0], Math.sin(theta / 2) * u[1], Math.sin(theta / 2) * u[2]]; 
};
Quaternion.RotateXQuaternion = theta => {
    return Quaternion.RotateQuaternion([1, 0, 0], theta);
};
Quaternion.RotateYQuaternion = theta => {
    return Quaternion.RotateQuaternion([0, 1, 0], theta); 
};
Quaternion.RotateZQuaternion = theta => {
    return Quaternion.RotateQuaternion([0, 0, 1], theta); 
};
// --使用四元数
Quaternion.ApplyQuaternion = (v, q) => {
    return Quaternion.Quaternion2Vector(Quaternion.Multiplication(Quaternion.Multiplication(q, Quaternion.Vector2Quaternion(v)), Quaternion.Conjugation(q))); 
};
// --四元数Slerp插值
Quaternion.SlerpQuaternion = (q1, q2, t) => {
    if (Quaternion.Norm(Quaternion.Add(q2, Quaternion.Scaling( -1, q1 ))) > 0.00005) {
        return Quaternion.Multiplication(Quaternion.Power(Quaternion.Multiplication(q2, Quaternion.Inverse(q1)), t), q1);
    } else {
        return q2;
    }
};
// --定义四元数
Quaternion.DefineQ = Quaternion.RotateQuaternion([0, 0, 0], 0);


// 矩阵乘法
function MatrixMultiplication(square1, square2){
    return square1.map(function(row) {
        return row.map(function(_, i) {
            return row.reduce(function(sum, cell, j) {
                return sum + cell * square2[j][i];
            }, 0);
        });
    }); 
}


// 求行列式
function MatrixDeterminant(square) {
    let n = square.length;
    let result = 0;
    if (n > 3) {
        for (let column = 0; column < n; column++) {
            let matrix = new Array(n - 1).fill(0).map(arr => new Array(n - 1).fill(0));
            for (let i = 0; i < n - 1; i++) {
                for (let j = 0; j < n - 1; j++) {
                    if (j < column) {
                        matrix[i][j] = square[i + 1][j];
                    } else {
                        matrix[i][j] = square[i + 1][j + 1];
                    }
                }
            }
            result += square[0][column] * Math.pow(-1, 0 + column) * MatrixDeterminant(matrix);
        }
    } else if (n === 3) {
        result = square[0][0] * square[1][1] * square[2][2] + square[0][1] * square[1][2] * square[2][0] + square[0][2] * square[1][0] * square[2][1] - square[0][2] * square[1][1] * square[2][0] - square[0][1] * square[1][0] * square[2][2] - square[0][0] * square[1][2] * square[2][1];
    } else if (n === 2) {
        result = square[0][0] * square[1][1] - square[0][1] * square[1][0];
    } else if (n === 1) {
        result = square[0][0];
    }
    return result;
}


// 求矩阵转置
function MatrixTranspose(matrix) {
    let result = new Array(matrix.length).fill(0).map(arr => new Array(matrix[0].length).fill(0));
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result[0].length; j++) {
            result[i][j] = matrix[j][i];
        }
    }
    return result;
}


// 求伴随矩阵
function MatrixAdjoint(square) {
    let n = square.length;
    let result = new Array(n).fill(0).map(arr => new Array(n).fill(0));
    for (let row = 0; row < n; row++) {
        for (let column = 0; column < n; column++) {
            let matrix = [];
            for (let i = 0; i < square.length; i++) {
                if (i !== row) {
                    let arr = [];
                    for (let j = 0; j < square.length; j++) {
                        if (j !== column) {
                            arr.push(square[i][j]);
                        }
                    }
                    matrix.push(arr);
                }
            }
            result[row][column] = Math.pow(-1, row + column) * MatrixDeterminant(matrix);
        }
    }
    return MatrixTranspose(result);
}


// 矩阵求逆
function MatrixInverse(square) {
    let det = MatrixDeterminant(square);
    let result = MatrixAdjoint(square);
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result.length; j++) {
            result[i][j] /= det;
        }
    }
    return result;
}


// 求向量L2范数
function L2Norm(vector) {
    let result = 0;
    for (let i = 0; i < vector.length; i++) {
        result += vector[i] * vector[i];
    }
    return Math.sqrt(result);
}


// 坐标映射
function Info2CoordinateProject(xyz, xc, yc, zc, a, b, c, nx, ny, nz) {
    var x = xyz[0], y = xyz[1], z = xyz[2];
    var t = (a * a + b * b + c * c) / (a * (x - xc) + b * (y - yc) + c * (z - zc));
    var coord = [[t * (x - xc) - a], [t * (y - yc) - b], [t * (z - zc) - c]];
    var norm_abc = L2Norm([a, b, c]), norm_n = L2Norm([nx, ny, nz]);
    a /= norm_abc;
    b /= norm_abc;
    c /= norm_abc;
    nx /= norm_n;
    ny /= norm_n;
    nz /= norm_n;
    var v = Quaternion.ApplyQuaternion([nx, ny, nz], Quaternion.RotateQuaternion([a, b, c], -Math.PI / 2));
    var result = MatrixMultiplication([[nx, ny, nz], v, [a, b, c]], coord);
    return [result[0][0], result[1][0], result[2][0]];
}