using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Threading.Tasks;

using OpenTK;
using OpenTK.Graphics.OpenGL;

namespace RayTracing
{
    public static class View
    {
        private static int BasicVertexShader;
        private static int BasicFragmentShader;
        private static int BasicProgramID;


        private static readonly int attribute_vpos;
        private static readonly int uniform_pos;
        private static readonly int uniform_aspect;
        private static readonly int uniform_color;
        private static int vbo_position;
        private static Vector3[] vertdata = new Vector3[] {
            new Vector3(-1f, -1f, 0f),
            new Vector3( 1f, -1f, 0f),
            new Vector3( 1f, 1f, 0f),
            new Vector3(-1f, 1f, 0f)
        };
        private static Vector3 campos;
        private static readonly float aspect;
        public static void SetupView(int width, int height)
        {
            GL.Viewport(0, 0, width, height);
            GL.ClearColor(Color.DarkGray);
            GL.ShadeModel(ShadingModel.Smooth);

            Matrix4 perspMat = Matrix4.CreatePerspectiveFieldOfView(MathHelper.PiOver4, width / (float)height, 1, 64);
            GL.MatrixMode(MatrixMode.Projection);
            GL.LoadMatrix(ref perspMat);
        }

        public static void ReDraw()
        {
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);
            GL.UseProgram(BasicProgramID);
            GL.EnableVertexAttribArray(attribute_vpos);
            GL.DrawArrays(PrimitiveType.Quads, 0, 4);
            GL.DisableVertexAttribArray(attribute_vpos);
            GL.UseProgram(0);
        }


        private static void loadShader(String filename, ShaderType type, int program, out int address)
        {
            address = GL.CreateShader(type);
            using (System.IO.StreamReader sr = new StreamReader(filename))
            {
                GL.ShaderSource(address, sr.ReadToEnd());
            }
            GL.CompileShader(address);
            GL.AttachShader(program, address);
            Console.WriteLine("--->" + GL.GetShaderInfoLog(address));
        }

        public static void DrawQuad()
        {
            vertdata = new Vector3[] {
                new Vector3(-1f, -1f, 0f),
                new Vector3( 1f, -1f, 0f),
                new Vector3( 1f, 1f, 0f),
                new Vector3(-1f, 1f, 0f)
            };
            GL.GenBuffers(1, out vbo_position);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);
            GL.BufferData<Vector3>(BufferTarget.ArrayBuffer, (IntPtr)(vertdata.Length *
            Vector3.SizeInBytes), vertdata, BufferUsageHint.StaticDraw);
            GL.VertexAttribPointer(attribute_vpos, 3, VertexAttribPointerType.Float, false, 0, 0);
            GL.Uniform3(uniform_pos, campos);
            GL.Uniform1(uniform_aspect, aspect);
            GL.UseProgram(BasicProgramID);
            GL.BindBuffer(BufferTarget.ArrayBuffer, 0);
        }


        public static void InitShaders()
        {
            BasicProgramID = GL.CreateProgram();

            loadShader("..\\..\\raytracing.vert", ShaderType.VertexShader, BasicProgramID, out BasicVertexShader);
            loadShader("..\\..\\raytracing.frag", ShaderType.FragmentShader, BasicProgramID, out BasicFragmentShader);
            
            Console.WriteLine("---||---" + BasicProgramID);
            Console.WriteLine("---||---" + BasicVertexShader);
            Console.WriteLine("---||---" + BasicFragmentShader);

            GL.LinkProgram(BasicProgramID);

            // Проверяем успех компоновки
            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);
            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
        }
    }
}
