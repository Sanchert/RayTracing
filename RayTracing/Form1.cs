using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

using OpenTK;
using OpenTK.Graphics.OpenGL;
using OpenTK.Platform.MacOS;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;

namespace RayTracing
{
    public partial class Form1 : Form
    {
        public int attribute_vpos;
        public int uniform_pos;
        public int uniform_aspect;
        public int uniform_color;
        //View V;
        
        int vbo_position;
        Vector3[] vertdata = new Vector3[] {
            new Vector3(-1f, -1f, 0f),
            new Vector3( 1f, -1f, 0f),
            new Vector3( 1f, 1f, 0f),
            new Vector3(-1f, 1f, 0f)
        };
        
        Vector3 campos;
        float aspect;
        public Form1()
        {
            InitializeComponent();
            //V = new View();
            campos = new Vector3(0f, 0f, 0f);
            aspect = (float)glControl1.Width / (float)glControl1.Height;
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            View.SetupView(glControl1.Width, glControl1.Height);
            View.InitShaders();

            GL.GenBuffers(1, out vbo_position);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);
            GL.BufferData(BufferTarget.ArrayBuffer, (IntPtr)(vertdata.Length * Vector3.SizeInBytes), vertdata, BufferUsageHint.StaticDraw);
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            View.SetupView(glControl1.Width, glControl1.Height);
            aspect = (float)glControl1.Width / (float)glControl1.Height;
            
            attribute_vpos = GL.GetAttribLocation(View.BasicProgramID, "vPosition");
            Console.WriteLine(attribute_vpos);
            GL.VertexAttribPointer(attribute_vpos, 3, VertexAttribPointerType.Float, false, 0, 0);
            GL.EnableVertexAttribArray(attribute_vpos);
            
            GL.Uniform3(uniform_pos, campos);
            GL.Uniform1(uniform_aspect, aspect);

            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);
            GL.UseProgram(View.BasicProgramID);

            GL.DrawArrays(PrimitiveType.Quads, 0, 4);

            glControl1.SwapBuffers();
            
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
        }
    }
}
