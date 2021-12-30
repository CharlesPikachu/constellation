// 初始化
var cvs = document.getElementById('canvas');
var ctx = cvs.getContext('2d');


// RGB空间转HSV空间
function RGBtoHSV (r, g, b, make_cone_model) {
    var h, s, v, max = Math.max(Math.max(r, g), b), min = Math.min(Math.min(r, g), b);
    if (max == min) {
        h = 0;
    } else if (max == r) {
        h = 60 * (g - b) / (max - min) + 0;
    } else if (max == g) {
        h = (60 * (b - r) / (max - min)) + 120;
    } else {
        h = (60 * (r - g) / (max - min)) + 240;
    }
    while (h < 0) {
        h += 360;
    }
    if (make_cone_model) {
        s = max - min;
    } else {
        s = (max == 0) ? 0: (max - min) / max * 255;
    }
    v = max;
    return {'h': h, 's': s, 'v': v};
}


// HSV空间转RGB空间
function HSVtoRGB (h, s, v) {
    var r, g, b;
    while (h < 0) {
        h += 360;
    }
    h = h % 360;
    if (s == 0) {
        v = Math.round(v);
        return {'r': v, 'g': v, 'b': v};
    }
    s = s / 255;
    var i = Math.floor(h / 60) % 6, f = (h / 60) - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {'r': Math.round(r), 'g': Math.round(g), 'b': Math.round(b)};
}


// 变形
function Morph(f, t, d) { 
    return f + (t - f) / d; 
}


// 画发光的圆弧
function DrawGlowingArc(x, y, r, red, green, blue, alpha) {
    var gco = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";
    var grad = ctx.createRadialGradient(x, y, r, x, y, 3 * r);
    grad.addColorStop(0.0, "rgba(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ", " + alpha.toString() + ")");
    grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.globalCompositeOperation = gco;
}


// 鼠标相关的事件定义
var mouse_x, mouse_y, is_clicked;
document.onmousemove = event => {
    mouse_x = event.clientX;
    mouse_y = event.clientY;
};
document.onmousedown = event => {
    is_clicked = true;
};
var focus_on_star = -1, focus_on_constellation = -1, star_coords = {}, star2constellation = {};
for (var item of star_locs_in_constellation) {
    star2constellation[item.num1] = short_constellation_names.indexOf(item.name);
    star2constellation[item.num2] = short_constellation_names.indexOf(item.name);
}
document.onmouseup = event => {
    focus_on_star = -1;
    var flag = false;
    for (var item in star_coords) {
        if (star_coords[item].xyz[2] > 0 && (mouse_x - star_coords[item].x) ** 2 + (mouse_y - star_coords[item].y) ** 2 <= 3 ** 2) {
            focus_on_star = item;
            focus_on_constellation = star_locs_in_constellation[focus_on_star] == undefined ? -1: star_locs_in_constellation[focus_on_star];
            flag = true;
        }
    }
    if (!flag) {
        focus_on_star = -1;
        focus_on_constellation = -1;
    }
    is_clicked = false;
};


// 键盘相关的事件定义
var shift_is_pressing = false, to_quaternion = Quaternion.DefineQ;
document.onkeydown = event => {
    var key_event = event || window.event;
    switch (key_event.keyCode) {
        // --向左旋转
        case 37: {
            to_quaternion = Quaternion.Multiplication(Quaternion.RotateXQuaternion(15 * RADIAN), to_quaternion);
            break;
        }
        // --向上旋转
        case 38: {
            to_quaternion = Quaternion.Multiplication(Quaternion.RotateYQuaternion(-15 * RADIAN), to_quaternion);
            break;
        }
        // --向右旋转
        case 39: {
            to_quaternion = Quaternion.Multiplication(Quaternion.RotateXQuaternion(-15 * RADIAN), to_quaternion);
            break;
        }
        // --向下旋转
        case 40: {
            to_quaternion = Quaternion.Multiplication(Quaternion.RotateYQuaternion(15 * RADIAN), to_quaternion);
            break;
        }
        // --打散
        case 90: {
            break;
        }
        // --按空格时如果已经按了shift, 则反方向顺序显示星座
        case 16: {
            shift_is_pressing = true;
            break;
        }
    };
};
var is_scattered = false, only_lightup_constellation = true, show_mode = 0, show_constellation_relation = true;
var num_to_star = {};
var vmag_min = Number.POSITIVE_INFINITY;
for (var item of stars) {
    vmag_min = Math.min(vmag_min, item.vmag);
    num_to_star[item.num] = item;
}
var constellation_loc_infos = {}, prepare_constellation_loc_infos = {}, prepare_constellation_loc_infos_set = new Set();
for (var item of star_locs_in_constellation) {
    if (prepare_constellation_loc_infos[item.name] == undefined) {
        prepare_constellation_loc_infos[item.name] = new Set();
    }
    prepare_constellation_loc_infos[item.name].add(item.num1);
    prepare_constellation_loc_infos[item.name].add(item.num2);
    prepare_constellation_loc_infos_set.add(item.num1);
    prepare_constellation_loc_infos_set.add(item.num2);
}
for (var item in prepare_constellation_loc_infos) {
    constellation_loc_infos[item] = {ra: 0, decl: 0};
    var head = prepare_constellation_loc_infos[item].values().next().value;
    constellation_loc_infos[item].ra = num_to_star[head].ra;
    constellation_loc_infos[item].decl = num_to_star[head].decl;
}
document.onkeyup = event => {
    var key_event = event || window.event;
    switch (key_event.keyCode) {
        // --打散
        case 90: {
            is_scattered ^= true;
            break;
        }
        // --只点亮星座相关的星星
        case 65: {
            only_lightup_constellation ^= true;
            break;
        }
        // --球面状态改变
        case 81: {
            ++show_mode;
            if (show_mode > 2) {
                show_mode = 0;
            }
            break;
        }
        // --按空格时如果已经按了shift, 则反方向顺序显示星座
        case 16: {
            shift_is_pressing = false;
            break;
        }
        // --顺序改变当前focus的星座
        case 32: {
            focus_on_star = -1;
            if (shift_is_pressing) {
                --focus_on_constellation;
            } else {
                ++focus_on_constellation;
            }
            if (focus_on_constellation >= short_constellation_names.length) {
                focus_on_constellation = 0;
            }
            if (focus_on_constellation < 0) {
                focus_on_constellation = short_constellation_names.length - 1;
            }
            var theta = Math.PI / 2 - constellation_loc_infos[short_constellation_names[focus_on_constellation]].decl;
            var phi = constellation_loc_infos[short_constellation_names[focus_on_constellation]].ra;
            to_quaternion = Quaternion.Multiplication(Quaternion.RotateXQuaternion(-theta), Quaternion.RotateZQuaternion(-phi - Math.PI / 2));
            break;
        }
        case 83: {
            show_constellation_relation ^= true;
            break;
        }
    }
};


// 渲染
var cur_quaternion = Quaternion.DefineQ;
var scale = 320, to_scale = 320, srat = 0, to_srat = 0;
(function Render() {
    // --init
    var w = cvs.width, h = cvs.height;
    ctx.fillStyle = "rgb(40,40,40)";
    ctx.fillRect(0, 0, w, h);
    // --quaternion
    cur_quaternion = Quaternion.SlerpQuaternion(cur_quaternion, to_quaternion, 0.1);
    // --scale
    scale = Morph(scale, to_scale, 10);
    to_scale = is_scattered ? 700 : 320;
    // --srat
    to_srat = show_mode == 0 ? 0: show_mode == 1 ? 1: 1000;
    srat = Morph(srat, to_srat, 4);
    // --star_coords
    star_coords = {};
    var max_r = 0;
    for (var item of stars) {
        max_r = Math.max(max_r, 1 / item.par);
    }
    for (var item of stars) {
        var theta = Math.PI / 2 - item.decl, phi = item.ra;
        var xyz = [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
        xyz = Quaternion.ApplyQuaternion(xyz, cur_quaternion);
        var xy = Info2CoordinateProject(xyz, 0, 0, -5, 0, 0, 5, 0, 1, 0);
        star_coords[item.num] = {
            x: w / 2 + (scale + srat * Math.min(100, 1/ item.par) * 300) * xy[0], 
            y: h / 2 + (scale + srat * Math.min(100, 1/ item.par) * 300) * xy[1], xyz: [].concat(xyz) 
        };
    }
    // --画星座连线
    var used_stars = {};
    if (show_constellation_relation) for (var item of star_locs_in_constellation) {
        var u = star_coords[item.num1], v = star_coords[item.num2];
        if (u != undefined && v != undefined && u.xyz[2] > 0 && v.xyz[2] > 0 && show_mode <= 1) {
            ctx.beginPath();
            var alpha;
            if (focus_on_star != -1) {
                alpha = prepare_constellation_loc_infos[item.name].has(parseFloat(focus_on_star)) ? 1.0 : 0.1;
            } else if (focus_on_constellation != -1) {
                alpha = item.name == short_constellation_names[focus_on_constellation] ? 1.0 : 0.1;
            } else {
                alpha = 1.0;
            }
            ctx.strokeStyle = "rgba(255,255,255," + alpha.toString() + ")";
            ctx.lineWidth = 1;
            ctx.moveTo(u.x, u.y);
            ctx.lineTo(v.x, v.y);
            ctx.stroke();
            if (!used_stars[item.name]) {
                var cx = 0, cy = 0;
                for (var number of prepare_constellation_loc_infos[item.name].values()) {
                    if (star_coords[number] != undefined) {
                        cx += star_coords[number].x / prepare_constellation_loc_infos[item.name].size;
                        cy += star_coords[number].y / prepare_constellation_loc_infos[item.name].size;
                    }
                }
                ctx.font = "normal 10px '仿宋'";
                ctx.fillStyle = "rgb(255,255,255)";
                constellation_name = constellation_names[short_constellation_names.indexOf(item.name)];
                ctx.fillText(constellation_name.cn_name, cx, cy);
                used_stars[item.name] = true;
            }
        }
    }
    // --画星星
    for (var item of stars) {
        var v = star_coords[item.num];
        if (v.xyz[2] > 0) {
            var alpha;
            if (focus_on_star != -1) {
                if (item.num == focus_on_star) {
                    alpha = 1.0;
                } else {
                    alpha = 0.1;
                }
            } else if (focus_on_constellation != -1) {
                if (prepare_constellation_loc_infos[short_constellation_names[focus_on_constellation]].has(item.num)) {
                    alpha = 1.0;
                } else {
                    alpha = 0.1;
                }
            } else {
                if (only_lightup_constellation) {
                    if (prepare_constellation_loc_infos_set.has(item.num)) {
                        alpha = 1.0;
                    } else {
                        alpha = 0.1;
                    }
                } else {
                    alpha = 3 ** (-(item.vmag - vmag_min) / (show_mode <= 1 ? 8: 20));
                }
            }
            var hsv = RGBtoHSV(Math.floor(item.r), Math.floor(item.g), Math.floor(item.b));
            var rgb = HSVtoRGB(hsv.h, hsv.s, 255);
            DrawGlowingArc(v.x, v.y, 3, rgb.r, rgb.g, rgb.b, alpha);
        }
    }
    ctx.font = "normal 15px '仿宋'";
    ctx.fillStyle = "rgb(255,255,255)";  
    ctx.fillText("作者: Charles, 微信公众号: Charles的皮卡丘", 20, 30); 
    ctx.fillText("操作指南: 鼠标点击对应的星星即可显示星星信息", 20, 50); 
    ctx.fillText("操作指南: 按Z键放大", 20, 70); 
    ctx.fillText("操作指南: 按空格键依次查看各个星座", 20, 90); 
    ctx.fillText("操作指南: 按←↑↓→键旋转球体", 20, 110); 
    ctx.fillText("操作指南: 按Q键切换显示的模式", 20, 130); 
    ctx.fillText("操作指南: 按S键开启或关闭星座里的星星连线", 20, 150); 
    var num_to_starenname = {};
    for (var item of constellation_name_en) {
        num_to_starenname[item.num] = item.name
    }
    if (focus_on_star != -1) {
        ctx.fillText("[星星信息]: ", 20, 200); 
        ctx.fillText("HIP编号: " + num_to_star[focus_on_star].num, 20, 220); 
        if (num_to_starenname[focus_on_star] != undefined) {
            ctx.fillText("名字: " + num_to_starenname[focus_on_star], 20, 240); 
        } else {
            ctx.fillText("名字: 暂无", 20, 240); 
        }
        ctx.fillText("赤经: " + num_to_star[focus_on_star].ra, 20, 260); 
        ctx.fillText("偏角: " + num_to_star[focus_on_star].decl, 20, 280); 
        ctx.fillText("视差: " + num_to_star[focus_on_star].par, 20, 300); 
        ctx.fillText("光年: " + 3.261563777 * 1000 / num_to_star[focus_on_star].par, 20, 320); 
        ctx.fillText("星等: " + num_to_star[focus_on_star].vmag, 20, 340); 
        ctx.fillText("B-V色指数: " + num_to_star[focus_on_star].bv, 20, 360); 
        ctx.fillText("温度: " + num_to_star[focus_on_star].temp, 20, 380); 
    }
    if (focus_on_constellation != -1) {
        ctx.fillText("[星座信息]: ", 20, 450); 
        ctx.fillText("中文名: " + constellation_names[focus_on_constellation].cn_name, 20, 470); 
        ctx.fillText("英文名: " + constellation_names[focus_on_constellation].en_name, 20, 490); 
        ctx.fillText("赤经: " + constellation_loc_infos[short_constellation_names[focus_on_constellation]].ra, 20, 510); 
        ctx.fillText("偏角: " + constellation_loc_infos[short_constellation_names[focus_on_constellation]].decl, 20, 530); 

    }
    requestAnimationFrame(Render);
})();